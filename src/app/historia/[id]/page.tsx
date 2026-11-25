"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  Badge,
  Button,
  CareNote,
  ErrorBox,
  KIND_LABEL,
  STATUS_LABEL,
  Spinner,
  VisibilityBadge,
  formatDate,
  inputClass,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Comment, StoryDetail } from "@/lib/types";

const SCOPE_LABEL: Record<string, string> = {
  abierto: "divulgación abierta",
  comunidad: "solo dentro de la comunidad",
  consulta: "solo consulta interna",
};

export default function HistoriaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, canModerate } = useAuth();

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.story(id);
      setStory(data);
      if (data.allow_comments) {
        const page = await api.comments(data.id);
        setComments(page.results.filter((comment) => comment.parent === null));
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorBox>{error}</ErrorBox>
        <Link href="/muro" className="text-sm text-monte-700 underline">
          Volver al muro
        </Link>
      </div>
    );
  }
  if (!story) return <Spinner />;

  const isAuthor = user?.id === story.author.id;

  const toggleLike = async () => {
    if (!user) {
      router.push("/entrar");
      return;
    }
    const liked = Boolean(story.my_reaction);
    const result = liked ? await api.unlike(story.id) : await api.like(story.id);
    setStory({
      ...story,
      like_count: result.like_count,
      my_reaction: liked ? null : "aprecio",
    });
  };

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      await api.addComment(story.id, draft.trim(), replyTo ?? undefined);
      setDraft("");
      setReplyTo(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <nav className="text-sm">
        <Link href="/muro" className="text-monte-700 hover:underline">
          ← Volver al muro
        </Link>
      </nav>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{KIND_LABEL[story.kind] ?? story.kind}</Badge>
          <VisibilityBadge value={story.visibility} />
          {story.is_sensitive && <Badge tone="warn">Contenido sensible</Badge>}
          {story.status !== "publicado" && (
            <Badge tone="warn">{STATUS_LABEL[story.status]}</Badge>
          )}
        </div>
        <h1 className="serif text-3xl leading-tight font-semibold">{story.title}</h1>
        {story.summary && <p className="text-lg text-sierra-700">{story.summary}</p>}
        <p className="text-sm text-sierra-500">
          {story.author.display_name}
          {story.community_name && (
            <>
              {" · "}
              <Link
                href={`/comunidades/${story.community_slug}`}
                className="hover:underline"
              >
                {story.community_name}
              </Link>
            </>
          )}
          {story.published_at && ` · ${formatDate(story.published_at)}`}
        </p>
        {story.location && (
          <p className="text-sm text-sierra-600">
            <span aria-hidden>📍 </span>
            {story.location.place_name}
            {story.location.approximate &&
              " — la ubicación exacta no se divulga por decisión de la comunidad."}
          </p>
        )}
      </header>

      {story.is_sensitive && (
        <CareNote>
          Este contenido está marcado como sensible: puede ser un saber colectivo,
          restringido o reservado. No se reproduce, transcribe ni comparte fuera de las
          condiciones que fijó la comunidad.
        </CareNote>
      )}

      {story.body && (
        <div className="prosa text-sierra-800">
          {story.body.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}

      {story.media.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Materiales</h2>
          <ul className="space-y-4">
            {story.media.map((item) => (
              <li
                key={item.id}
                className="overflow-hidden rounded-xl border border-sierra-200 bg-white"
              >
                {item.kind === "imagen" && (item.file || item.external_url) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.file ?? item.external_url}
                    alt={item.caption}
                    className="w-full object-cover"
                  />
                )}
                {item.kind === "audio" && item.file && (
                  <audio controls src={item.file} className="w-full p-4" />
                )}
                {item.kind === "video" && item.external_url && (
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-4 py-3 text-monte-700 underline"
                  >
                    Ver el video en su fuente original
                  </a>
                )}
                <div className="space-y-1 px-4 py-3 text-sm">
                  {item.caption && <p className="font-medium">{item.caption}</p>}
                  {item.credit && (
                    <p className="text-xs text-sierra-500">Nota. {item.credit}</p>
                  )}
                  {item.transcript && (
                    <details className="pt-1">
                      <summary className="cursor-pointer text-xs text-monte-700">
                        Transcripción revisada
                      </summary>
                      <p className="prosa mt-2 text-sierra-700">{item.transcript}</p>
                    </details>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {story.visit && (
        <section className="space-y-2 rounded-xl border border-sierra-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Datos de la visita</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-sierra-500">Fechas</dt>
              <dd>
                {formatDate(story.visit.starts_on)}
                {story.visit.ends_on && ` — ${formatDate(story.visit.ends_on)}`}
              </dd>
            </div>
            {story.visit.meeting_point && (
              <div>
                <dt className="text-sierra-500">Punto de encuentro</dt>
                <dd>{story.visit.meeting_point}</dd>
              </div>
            )}
            {story.visit.capacity !== null && (
              <div>
                <dt className="text-sierra-500">Cupo</dt>
                <dd>{story.visit.capacity} personas</dd>
              </div>
            )}
            {story.visit.contact && (
              <div>
                <dt className="text-sierra-500">Contacto</dt>
                <dd>{story.visit.contact}</dd>
              </div>
            )}
          </dl>
          {story.visit.conditions && (
            <CareNote>{story.visit.conditions}</CareNote>
          )}
        </section>
      )}

      {story.promotion && (
        <section className="space-y-2 rounded-xl border border-tierra-300 bg-tierra-100/50 p-5">
          <h2 className="text-lg font-semibold">Iniciativa que se promociona</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-sierra-500">Categoría</dt>
              <dd>{story.promotion.category}</dd>
            </div>
            {story.promotion.contact && (
              <div>
                <dt className="text-sierra-500">Contacto</dt>
                <dd>{story.promotion.contact}</dd>
              </div>
            )}
            {story.promotion.price_note && (
              <div className="sm:col-span-2">
                <dt className="text-sierra-500">Precio</dt>
                <dd>{story.promotion.price_note}</dd>
              </div>
            )}
          </dl>
          <p className="text-xs text-sierra-500">
            La plataforma no procesa pagos: el acuerdo es directo con quien promociona.
          </p>
        </section>
      )}

      {story.consents.length > 0 && (
        <section className="rounded-xl border border-monte-300 bg-monte-50 p-5 text-sm">
          <h2 className="mb-2 font-semibold">Autorización</h2>
          <ul className="space-y-1.5">
            {story.consents.map((consent, index) => (
              <li key={consent.id ?? index}>
                {consent.granted_by_name ? (
                  <>
                    <strong>{consent.granted_by_name}</strong>
                    {consent.granted_by_role && ` (${consent.granted_by_role})`} —{" "}
                  </>
                ) : (
                  "Autorización registrada — "
                )}
                {SCOPE_LABEL[consent.scope] ?? consent.scope}, {formatDate(consent.granted_on)}
                {consent.conditions && (
                  <span className="mt-0.5 block text-xs text-sierra-600">
                    Condiciones: {consent.conditions}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3 border-y border-sierra-200 py-4">
        <Button variant={story.my_reaction ? "primary" : "ghost"} onClick={toggleLike}>
          <span aria-hidden>{story.my_reaction ? "♥" : "♡"}</span>
          {story.like_count} aprecio(s)
        </Button>
        <span className="text-sm text-sierra-500">
          {story.comment_count} comentario(s) · {story.view_count} vistas
        </span>
        {(isAuthor || canModerate) && (
          <Link
            href={`/publicar?editar=${story.id}`}
            className="ml-auto text-sm text-monte-700 underline"
          >
            Editar
          </Link>
        )}
      </div>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Comentarios</h2>

        {!story.allow_comments ? (
          <p className="text-sm text-sierra-600">
            Esta historia no admite comentarios por decisión de quien la publicó.
          </p>
        ) : (
          <>
            {user ? (
              <form onSubmit={submitComment} className="space-y-2">
                {replyTo && (
                  <p className="text-xs text-sierra-600">
                    Respondiendo a un comentario.{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setReplyTo(null)}
                    >
                      Cancelar
                    </button>
                  </p>
                )}
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={3}
                  placeholder="Escriba con respeto por quien comparte la memoria."
                  className={inputClass}
                />
                <Button type="submit" disabled={sending || !draft.trim()}>
                  {sending ? "Enviando…" : "Comentar"}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-sierra-600">
                <Link href="/entrar" className="text-monte-700 underline">
                  Inicie sesión
                </Link>{" "}
                para comentar.
              </p>
            )}

            <ul className="space-y-4">
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className="rounded-xl border border-sierra-200 bg-white p-4"
                >
                  <p className="text-sm font-medium">{comment.author.display_name}</p>
                  <p className="text-xs text-sierra-400">
                    {formatDate(comment.created_at)}
                  </p>
                  <p className="mt-2 text-sierra-800">{comment.body}</p>
                  {user && (
                    <button
                      type="button"
                      onClick={() => setReplyTo(comment.id)}
                      className="mt-2 text-xs text-monte-700 underline"
                    >
                      Responder
                    </button>
                  )}
                  {comment.replies.length > 0 && (
                    <ul className="mt-3 space-y-3 border-l-2 border-sierra-200 pl-4">
                      {comment.replies.map((reply) => (
                        <li key={reply.id}>
                          <p className="text-sm font-medium">
                            {reply.author.display_name}
                          </p>
                          <p className="text-xs text-sierra-400">
                            {formatDate(reply.created_at)}
                          </p>
                          <p className="mt-1 text-sierra-800">{reply.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </article>
  );
}
