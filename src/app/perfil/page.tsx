"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Badge,
  Button,
  Empty,
  ErrorBox,
  Field,
  STATUS_LABEL,
  Spinner,
  StoryCard,
  formatDate,
  inputClass,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Story } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  visitante: "Visitante",
  miembro: "Miembro de comunidad",
  autoridad: "Autoridad tradicional",
  moderador: "Moderación",
  admin: "Administración",
};

export default function PerfilPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [form, setForm] = useState({ display_name: "", bio: "", place: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/entrar");
      return;
    }
    setForm({ display_name: user.display_name, bio: user.bio, place: user.place });
    api
      .myStories()
      .then((page) => setStories(page.results))
      .catch((err: Error) => setError(err.message));
  }, [loading, user, router]);

  if (loading || !user) return <Spinner />;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await api.updateMe(form);
      await refresh();
      setMessage("Perfil actualizado.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const drafts = stories?.filter((story) => story.status !== "publicado") ?? [];
  const published = stories?.filter((story) => story.status === "publicado") ?? [];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{user.display_name}</h1>
        <p className="text-sm text-sierra-500">
          {user.email} · {ROLE_LABEL[user.role] ?? user.role}
          {user.accepted_care_terms_at &&
            ` · aceptó los criterios de cuidado cultural el ${formatDate(
              user.accepted_care_terms_at
            )}`}
        </p>
      </header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Mis comunidades</h2>
        {user.communities.length === 0 ? (
          <p className="text-sm text-sierra-600">
            No pertenece a ninguna comunidad.{" "}
            <Link href="/comunidades" className="text-monte-700 underline">
              Ver comunidades
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {user.communities.map((membership) => (
              <li key={membership.id}>
                <Link href={`/comunidades/${membership.community_slug}`}>
                  <Badge tone={membership.status === "activo" ? "ok" : "warn"}>
                    {membership.community_name} · {membership.role}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <form
          onSubmit={save}
          className="space-y-4 rounded-xl border border-sierra-200 bg-white p-6"
        >
          <h2 className="font-semibold">Editar perfil</h2>
          {message && (
            <p className="rounded-lg border border-monte-300 bg-monte-50 px-4 py-2 text-sm text-monte-700">
              {message}
            </p>
          )}
          <Field label="Nombre visible">
            <input
              className={inputClass}
              value={form.display_name}
              onChange={(event) =>
                setForm({ ...form, display_name: event.target.value })
              }
            />
          </Field>
          <Field label="Lugar">
            <input
              className={inputClass}
              value={form.place}
              onChange={(event) => setForm({ ...form, place: event.target.value })}
            />
          </Field>
          <Field label="Presentación">
            <textarea
              rows={3}
              className={inputClass}
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
            />
          </Field>
          <Button type="submit" disabled={busy}>
            {busy ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">Mis publicaciones</h2>
          <Link href="/publicar" className="text-sm text-monte-700 hover:underline">
            Publicar algo
          </Link>
        </div>

        {stories === null ? (
          <Spinner />
        ) : stories.length === 0 ? (
          <Empty title="Todavía no ha publicado nada">
            Puede empezar un borrador y registrar la autorización de la comunidad antes de
            enviarlo a revisión.
          </Empty>
        ) : (
          <>
            {drafts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-sierra-700">
                  Borradores y en revisión
                </h3>
                <ul className="space-y-2">
                  {drafts.map((story) => (
                    <li
                      key={story.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-sierra-200 bg-white p-4"
                    >
                      <Link
                        href={`/historia/${story.id}`}
                        className="font-medium hover:underline"
                      >
                        {story.title}
                      </Link>
                      <Badge tone="warn">{STATUS_LABEL[story.status]}</Badge>
                      <Link
                        href={`/publicar?editar=${story.id}`}
                        className="ml-auto text-sm text-monte-700 underline"
                      >
                        Continuar
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {published.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-sierra-700">Publicadas</h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {published.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
