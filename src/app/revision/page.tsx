"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  Badge,
  Button,
  CareNote,
  Empty,
  ErrorBox,
  Field,
  KIND_LABEL,
  Spinner,
  VisibilityBadge,
  formatDate,
  inputClass,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { CareReview, Consent, Story } from "@/lib/types";

const TIPO_HALLAZGO: Record<string, string> = {
  lugar: "Lugar que puede ser sagrado",
  practica: "Práctica ceremonial",
  saber: "Saber reservado",
  persona: "Palabras atribuidas a una persona",
};

interface ConsentDraft extends Record<string, unknown> {
  granted_by_name: string;
  granted_by_role: string;
  scope: string;
  granted_on: string;
  conditions: string;
}

const emptyDraft = (): ConsentDraft => ({
  granted_by_name: "",
  granted_by_role: "",
  scope: "comunidad",
  granted_on: new Date().toISOString().slice(0, 10),
  conditions: "",
});

export default function RevisionPage() {
  const router = useRouter();
  const { user, loading, canModerate } = useAuth();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [consents, setConsents] = useState<Record<number, Consent[]>>({});
  const [reviews, setReviews] = useState<Record<number, CareReview>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [drafts, setDrafts] = useState<Record<number, ConsentDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const draftFor = (id: number): ConsentDraft => drafts[id] ?? emptyDraft();
  const setDraft = (id: number, patch: Partial<ConsentDraft>) =>
    setDrafts((current) => ({
      ...current,
      [id]: { ...draftFor(id), ...patch },
    }));

  const load = useCallback(async () => {
    try {
      const page = await api.pendingReview();
      setStories(page.results);
      const entries = await Promise.all(
        page.results.map(async (story) => {
          try {
            return [story.id, await api.consents(story.id)] as const;
          } catch {
            return [story.id, []] as const;
          }
        })
      );
      setConsents(Object.fromEntries(entries));

      const revisiones = await Promise.all(
        page.results.map(async (story) => {
          try {
            return [story.id, await api.careReview(story.id)] as const;
          } catch {
            return [story.id, null] as const;
          }
        })
      );
      setReviews(
        Object.fromEntries(
          revisiones.filter((e): e is [number, CareReview] => e[1] !== null)
        )
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/entrar");
      return;
    }
    void load();
  }, [loading, user, router, load]);

  if (loading || (!stories && !error)) return <Spinner />;
  if (!canModerate) {
    return (
      <Empty title="Esta sección es para autoridades y moderación">
        No administra ninguna comunidad en Memorias Vivas.
      </Empty>
    );
  }

  const registerConsent = async (story: Story) => {
    const draft = draftFor(story.id);
    setBusy(true);
    setError(null);
    try {
      await api.addConsent(story.id, draft);
      setConsents({ ...consents, [story.id]: await api.consents(story.id) });
      setDrafts((current) => ({ ...current, [story.id]: emptyDraft() }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const act = async (story: Story, action: "publicar" | "rechazar") => {
    setBusy(true);
    setError(null);
    try {
      const note = notes[story.id] ?? "";
      if (action === "publicar") await api.publish(story.id, note);
      else await api.reject(story.id, note);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Revisión de la comunidad</h1>
        <p className="max-w-2xl text-sm text-sierra-600">
          Historias enviadas a revisión. Nada se publica sin una autorización registrada:
          si falta, la plataforma rechaza la publicación.
        </p>
      </header>

      <CareNote>
        Antes de publicar, verifique que la autorización corresponde al alcance elegido y
        que el contenido no expone saberes reservados, sitios sagrados ni voces sin
        consentimiento.
      </CareNote>

      {error && <ErrorBox>{error}</ErrorBox>}

      {stories && stories.length === 0 ? (
        <Empty title="No hay nada por revisar" />
      ) : (
        <ul className="space-y-5">
          {stories?.map((story) => {
            const storyConsents = consents[story.id] ?? [];
            const hasConsent = storyConsents.length > 0;
            return (
              <li
                key={story.id}
                className="space-y-4 rounded-xl border border-sierra-200 bg-white p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{KIND_LABEL[story.kind] ?? story.kind}</Badge>
                  <VisibilityBadge value={story.visibility} />
                  {story.is_sensitive && <Badge tone="warn">Contenido sensible</Badge>}
                  <Badge tone={hasConsent ? "ok" : "warn"}>
                    {hasConsent ? "Autorización registrada" : "Sin autorización"}
                  </Badge>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    <Link href={`/historia/${story.id}`} className="hover:underline">
                      {story.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-sierra-500">
                    {story.author.display_name}
                    {story.community_name && ` · ${story.community_name}`}
                    {` · creada el ${formatDate(story.created_at)}`}
                  </p>
                </div>

                {story.summary && (
                  <p className="text-sm text-sierra-700">{story.summary}</p>
                )}

                {reviews[story.id]?.resumen && (
                  <section className="rounded-xl border border-sierra-300 bg-sierra-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">
                        Nota del revisor de cuidado cultural
                      </h3>
                      <Badge
                        tone={
                          reviews[story.id].hallazgos.length ? "warn" : "neutral"
                        }
                      >
                        {reviews[story.id].hallazgos.length
                          ? `${reviews[story.id].hallazgos.length} para verificar`
                          : "sin señalamientos"}
                      </Badge>
                    </div>

                    <p className="mt-2 text-sm text-sierra-700">
                      {reviews[story.id].resumen}
                    </p>

                    {reviews[story.id].hallazgos.length > 0 && (
                      <ul className="mt-3 space-y-1.5 text-sm">
                        {reviews[story.id].hallazgos.map((h, index) => (
                          <li key={index} className="border-l-2 border-tierra-300 pl-3">
                            <strong>{TIPO_HALLAZGO[h.tipo] ?? h.tipo}</strong>
                            {h.fragmento && <> — «{h.fragmento}»</>}
                            {h.por_que && (
                              <span className="block text-xs text-sierra-600">
                                {h.por_que}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className="mt-3 text-xs text-sierra-500">
                      El revisor señala, no decide: la publicación sigue siendo
                      suya. Solo busca lo que la comunidad le enseñó a buscar, así
                      que no reemplaza su lectura.
                    </p>
                  </section>
                )}

                {hasConsent ? (
                  <ul className="space-y-1 rounded-lg bg-monte-50 p-3 text-sm">
                    {storyConsents.map((consent, index) => (
                      <li key={consent.id ?? index}>
                        <strong>{consent.granted_by_name}</strong>
                        {consent.granted_by_role && ` (${consent.granted_by_role})`} ·{" "}
                        alcance {consent.scope} · {formatDate(consent.granted_on)}
                        {consent.conditions && (
                          <span className="block text-xs text-sierra-600">
                            Condiciones: {consent.conditions}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-4 rounded-xl border border-tierra-300 bg-tierra-100/40 p-4">
                    <div>
                      <h3 className="font-semibold">Registrar la autorización</h3>
                      <p className="mt-1 text-sm text-sierra-700">
                        Sin este registro la plataforma no deja publicar. Anote quién
                        autorizó el contenido y bajo qué condiciones, tal como lo dijo
                        la comunidad.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Quién autoriza">
                        <input
                          className={inputClass}
                          placeholder="Nombre de la persona o autoridad"
                          value={draftFor(story.id).granted_by_name}
                          onChange={(event) =>
                            setDraft(story.id, { granted_by_name: event.target.value })
                          }
                        />
                      </Field>
                      <Field
                        label="En qué calidad"
                        hint="Mamo, Cabildo Gobernador, la persona del relato…"
                      >
                        <input
                          className={inputClass}
                          value={draftFor(story.id).granted_by_role}
                          onChange={(event) =>
                            setDraft(story.id, { granted_by_role: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Alcance autorizado">
                        <select
                          className={inputClass}
                          value={draftFor(story.id).scope}
                          onChange={(event) =>
                            setDraft(story.id, { scope: event.target.value })
                          }
                        >
                          <option value="abierto">Divulgación abierta</option>
                          <option value="comunidad">Solo dentro de la comunidad</option>
                          <option value="consulta">Solo consulta interna</option>
                        </select>
                      </Field>
                      <Field label="Fecha de la autorización">
                        <input
                          type="date"
                          className={inputClass}
                          value={draftFor(story.id).granted_on}
                          onChange={(event) =>
                            setDraft(story.id, { granted_on: event.target.value })
                          }
                        />
                      </Field>
                    </div>

                    <Field
                      label="Condiciones de uso"
                      hint="No reproducir el audio, no mapear, no usar fuera de la comunidad…"
                    >
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={draftFor(story.id).conditions}
                        onChange={(event) =>
                          setDraft(story.id, { conditions: event.target.value })
                        }
                      />
                    </Field>

                    <Button
                      onClick={() => registerConsent(story)}
                      disabled={busy || !draftFor(story.id).granted_by_name.trim()}
                    >
                      Registrar autorización
                    </Button>
                  </div>
                )}

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-sierra-800">
                    Nota de revisión
                  </span>
                  <input
                    className={inputClass}
                    value={notes[story.id] ?? ""}
                    onChange={(event) =>
                      setNotes({ ...notes, [story.id]: event.target.value })
                    }
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => act(story, "publicar")}
                    disabled={busy || !hasConsent}
                  >
                    Publicar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => act(story, "rechazar")}
                    disabled={busy}
                  >
                    No autorizar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
