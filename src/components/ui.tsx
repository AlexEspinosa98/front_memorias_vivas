"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { Story, Visibility } from "@/lib/types";

const VISIBILITY_LABEL: Record<Visibility, string> = {
  publico: "Uso abierto",
  registrado: "Personas registradas",
  comunidad: "Solo la comunidad",
  restringido: "Acceso restringido",
};

const VISIBILITY_STYLE: Record<Visibility, string> = {
  publico: "bg-monte-100 text-monte-700 border-monte-300",
  registrado: "bg-sierra-100 text-sierra-700 border-sierra-300",
  comunidad: "bg-tierra-100 text-tierra-600 border-tierra-300",
  restringido: "bg-sierra-800 text-sierra-50 border-sierra-800",
};

export const KIND_LABEL: Record<string, string> = {
  relato: "Relato",
  testimonio: "Testimonio",
  memoria: "Memoria",
  saber: "Saber o práctica",
  lengua: "Lengua Ika",
  visita: "Visita",
  evento: "Evento",
  promocion: "Promoción",
  aviso: "Aviso",
};

export const STATUS_LABEL: Record<string, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicado: "Publicado",
  archivado: "Archivado",
  rechazado: "No autorizado",
};

export function VisibilityBadge({ value }: { value: Visibility }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${VISIBILITY_STYLE[value]}`}
      title={`Visibilidad: ${VISIBILITY_LABEL[value]}`}
    >
      {VISIBILITY_LABEL[value]}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "warn" | "ok";
}) {
  const styles = {
    neutral: "bg-sierra-100 text-sierra-700 border-sierra-200",
    warn: "bg-tierra-100 text-tierra-600 border-tierra-300",
    ok: "bg-monte-100 text-monte-700 border-monte-300",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  type = "button",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-monte-600 text-white hover:bg-monte-700 disabled:bg-sierra-300 disabled:text-sierra-600",
    ghost:
      "border border-sierra-300 bg-white text-sierra-800 hover:bg-sierra-100 disabled:opacity-50",
    danger: "bg-tierra-600 text-white hover:bg-tierra-500 disabled:opacity-50",
  }[variant];
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-sierra-800">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-sierra-500">{hint}</span>
      )}
      {error && <span className="mt-1 block text-xs text-tierra-600">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-sierra-300 bg-white px-3 py-2 text-sm text-sierra-900 outline-none focus:border-monte-500 focus:ring-2 focus:ring-monte-500/20";

export function CareNote({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-lg border-l-4 border-tierra-300 bg-tierra-100/60 px-4 py-3 text-sm text-sierra-800">
      <strong className="font-semibold">Criterio de cuidado cultural. </strong>
      {children}
    </aside>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-sierra-300 bg-white/60 px-6 py-10 text-center">
      <p className="font-medium text-sierra-800">{title}</p>
      {children && <p className="mt-2 text-sm text-sierra-600">{children}</p>}
    </div>
  );
}

export function Spinner({ label = "Cargando…" }: { label?: string }) {
  return (
    <p className="py-8 text-center text-sm text-sierra-500" role="status">
      {label}
    </p>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <p
      className="rounded-lg border border-tierra-300 bg-tierra-100 px-4 py-3 text-sm text-tierra-600"
      role="alert"
    >
      {children}
    </p>
  );
}

export function formatDate(value: string | null): string {
  if (!value) return "";
  // Una fecha sin hora («2026-11-25», como las de autorización o visita) se
  // interpreta como medianoche UTC; al mostrarla en hora de Colombia (UTC-5)
  // retrocede un día. Se ancla al mediodía para que la fecha no se mueva.
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const fecha = new Date(soloFecha ? `${value}T12:00:00` : value);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function StoryCard({
  story,
  onLike,
}: {
  story: Story;
  onLike?: (story: Story) => void;
}) {
  const liked = Boolean(story.my_reaction);
  return (
    <article className="overflow-hidden rounded-xl border border-sierra-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {story.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.cover}
          alt=""
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{KIND_LABEL[story.kind] ?? story.kind}</Badge>
          <VisibilityBadge value={story.visibility} />
          {story.is_sensitive && <Badge tone="warn">Contenido sensible</Badge>}
          {story.status !== "publicado" && (
            <Badge tone="warn">{STATUS_LABEL[story.status]}</Badge>
          )}
        </div>

        <h3 className="text-lg leading-snug font-semibold">
          <Link href={`/historia/${story.id}`} className="hover:underline">
            {story.title}
          </Link>
        </h3>

        {story.summary && (
          <p className="text-sm text-sierra-600">{story.summary}</p>
        )}

        <dl className="space-y-1 text-xs text-sierra-500">
          <div>
            <dt className="sr-only">Autoría</dt>
            <dd>
              {story.author.display_name}
              {story.community_name && ` · ${story.community_name}`}
            </dd>
          </div>
          {story.location && (
            <div>
              <dt className="sr-only">Lugar</dt>
              <dd>
                {story.location.place_name}
                {story.location.approximate && " (ubicación reservada)"}
              </dd>
            </div>
          )}
          {story.published_at && (
            <div>
              <dt className="sr-only">Fecha</dt>
              <dd>{formatDate(story.published_at)}</dd>
            </div>
          )}
        </dl>

        {story.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {story.tags.map((tag) => (
              <li key={tag.id}>
                <Link
                  href={`/muro?etiqueta=${tag.slug}`}
                  className="rounded bg-sierra-100 px-2 py-0.5 text-xs text-sierra-600 hover:bg-sierra-200"
                >
                  {tag.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-4 border-t border-sierra-100 pt-3 text-sm">
          <button
            type="button"
            onClick={() => onLike?.(story)}
            disabled={!onLike}
            aria-pressed={liked}
            className={`inline-flex items-center gap-1.5 rounded px-1 ${
              onLike ? "hover:text-monte-600" : "cursor-default"
            } ${liked ? "font-semibold text-monte-600" : "text-sierra-500"}`}
          >
            <span aria-hidden>{liked ? "♥" : "♡"}</span>
            {story.like_count}
            <span className="sr-only">aprecios</span>
          </button>
          <Link
            href={`/historia/${story.id}`}
            className="inline-flex items-center gap-1.5 text-sierra-500 hover:text-monte-600"
          >
            <span aria-hidden>💬</span>
            {story.comment_count}
            <span className="sr-only">comentarios</span>
          </Link>
          <span className="ml-auto text-xs text-sierra-400">
            {story.view_count} vistas
          </span>
        </div>
      </div>
    </article>
  );
}
