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
  KIND_LABEL,
  Spinner,
  VisibilityBadge,
  formatDate,
  inputClass,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Consent, Story } from "@/lib/types";

export default function RevisionPage() {
  const router = useRouter();
  const { user, loading, canModerate } = useAuth();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [consents, setConsents] = useState<Record<number, Consent[]>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
                  <ErrorBox>
                    No se puede publicar: falta el registro de la autorización de la
                    comunidad.
                  </ErrorBox>
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
