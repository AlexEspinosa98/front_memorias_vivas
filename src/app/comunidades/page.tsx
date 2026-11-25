"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge, ErrorBox, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Community } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Solicitud pendiente",
  activo: "Miembro",
  rechazado: "Solicitud rechazada",
  retirado: "Retirado",
};

export default function ComunidadesPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .communities()
      .then((page) => setCommunities(page.results))
      .catch((err: Error) => setError(err.message));
  }, [user]);

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!communities) return <Spinner />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Comunidades</h1>
        <p className="max-w-2xl text-sm text-sierra-600">
          Cada comunidad decide qué comparte y con quién. Las funciones y relaciones entre
          autoridades pueden variar: no se presenta una única estructura como si fuera
          idéntica en todos los asentamientos.
        </p>
      </header>

      <ul className="grid gap-5 sm:grid-cols-2">
        {communities.map((community) => (
          <li
            key={community.id}
            className="rounded-xl border border-sierra-200 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">
                <Link
                  href={`/comunidades/${community.slug}`}
                  className="hover:underline"
                >
                  {community.name}
                </Link>
              </h2>
              {community.my_membership && (
                <Badge tone={community.my_membership.status === "activo" ? "ok" : "warn"}>
                  {STATUS_LABEL[community.my_membership.status]}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-sierra-500">
              {community.people}
              {community.territory && ` · ${community.territory}`}
            </p>
            {community.description && (
              <p className="mt-3 text-sm text-sierra-700">{community.description}</p>
            )}
            <p className="mt-3 text-xs text-sierra-500">
              {[community.municipality, community.department].filter(Boolean).join(", ")}
              {" · "}
              {community.member_count} miembro(s)
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
