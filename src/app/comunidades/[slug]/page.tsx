"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  Badge,
  Button,
  ErrorBox,
  Field,
  Spinner,
  StoryCard,
  inputClass,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Community, Membership, Story } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  miembro: "Miembro",
  autoridad: "Autoridad tradicional",
  moderador: "Moderación de la comunidad",
};

export default function ComunidadPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, refresh, managedCommunities, canModerate } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [members, setMembers] = useState<Membership[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.community(slug);
      setCommunity(data);
      const page = await api.stories({ comunidad: slug });
      setStories(page.results);
      if (user) {
        try {
          setMembers(await api.communityMembers(slug));
        } catch {
          setMembers([]);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }, [slug, user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!community) return <Spinner />;

  const administers =
    canModerate &&
    (user?.role === "admin" ||
      user?.role === "moderador" ||
      managedCommunities.some((m) => m.community === community.id));

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.joinCommunity(slug, note);
      setMessage(
        "Solicitud enviada. Una autoridad de la comunidad decidirá sobre su ingreso."
      );
      await refresh();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const decide = async (membership: Membership, status: string) => {
    setBusy(true);
    try {
      await api.decideMembership(slug, membership.id, status);
      setMembers(await api.communityMembers(slug));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pending = members.filter((m) => m.status === "pendiente");
  const active = members.filter((m) => m.status === "activo");

  return (
    <div className="space-y-10">
      <nav className="text-sm">
        <Link href="/comunidades" className="text-monte-700 hover:underline">
          ← Comunidades
        </Link>
      </nav>

      <header className="space-y-3">
        <h1 className="serif text-3xl font-semibold">{community.name}</h1>
        <p className="text-sm text-sierra-500">
          {community.people}
          {community.territory && ` · ${community.territory}`}
          {community.municipality &&
            ` · ${community.municipality}, ${community.department}`}
        </p>
        {community.description && (
          <p className="max-w-2xl text-sierra-700">{community.description}</p>
        )}
        <p className="text-sm text-sierra-500">{community.member_count} miembro(s)</p>
      </header>

      {message && (
        <p className="rounded-lg border border-monte-300 bg-monte-50 px-4 py-3 text-sm text-monte-700">
          {message}
        </p>
      )}

      {user && !community.my_membership && community.is_open_to_requests && (
        <section className="space-y-3 rounded-xl border border-sierra-200 bg-white p-6">
          <h2 className="font-semibold">Solicitar ingreso</h2>
          <p className="text-sm text-sierra-600">
            El ingreso lo deciden las autoridades de la comunidad. Cuénteles quién es o
            quién la presenta.
          </p>
          <Field label="Nota de la solicitud">
            <textarea
              rows={2}
              className={inputClass}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
          <Button onClick={join} disabled={busy}>
            Enviar solicitud
          </Button>
        </section>
      )}

      {user && community.my_membership && (
        <p className="text-sm">
          Su vínculo con esta comunidad:{" "}
          <Badge tone={community.my_membership.status === "activo" ? "ok" : "warn"}>
            {ROLE_LABEL[community.my_membership.role]} ·{" "}
            {community.my_membership.status}
          </Badge>
        </p>
      )}

      {administers && pending.length > 0 && (
        <section className="space-y-4 rounded-xl border border-tierra-300 bg-tierra-100/40 p-6">
          <h2 className="font-semibold">Solicitudes por decidir ({pending.length})</h2>
          <ul className="space-y-3">
            {pending.map((membership) => (
              <li
                key={membership.id}
                className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3"
              >
                <div className="min-w-48">
                  <p className="text-sm font-medium">
                    {membership.user?.display_name}
                  </p>
                  {membership.note && (
                    <p className="text-xs text-sierra-600">{membership.note}</p>
                  )}
                </div>
                <div className="ml-auto flex gap-2">
                  <Button
                    onClick={() => decide(membership, "activo")}
                    disabled={busy}
                  >
                    Aceptar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => decide(membership, "rechazado")}
                    disabled={busy}
                  >
                    Rechazar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Miembros</h2>
          <ul className="flex flex-wrap gap-2">
            {active.map((membership) => (
              <li
                key={membership.id}
                className="rounded-full border border-sierra-200 bg-white px-3 py-1 text-sm"
              >
                {membership.user?.display_name}
                <span className="ml-1.5 text-xs text-sierra-500">
                  {ROLE_LABEL[membership.role]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Historias de esta comunidad</h2>
        {stories.length === 0 ? (
          <p className="text-sm text-sierra-600">
            No hay historias visibles para su nivel de acceso.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
