"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import {
  Badge,
  Button,
  CareNote,
  ErrorBox,
  Field,
  KIND_LABEL,
  Spinner,
  inputClass,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { StoryDetail, Visibility } from "@/lib/types";

const VISIBILITIES: { value: Visibility; label: string; help: string }[] = [
  {
    value: "publico",
    label: "Uso abierto",
    help: "Cualquier persona lo ve, incluso sin iniciar sesión.",
  },
  {
    value: "registrado",
    label: "Personas registradas",
    help: "Solo quienes tienen cuenta en Memorias Vivas.",
  },
  {
    value: "comunidad",
    label: "Solo la comunidad",
    help: "Solo los miembros activos de la comunidad que elija.",
  },
  {
    value: "restringido",
    label: "Acceso restringido",
    help: "Solo las personas a las que la autoridad conceda permiso, una por una.",
  },
];

function PublicarContenido() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("editar");
  const { user, loading, myCommunities } = useAuth();

  const [form, setForm] = useState({
    title: "",
    summary: "",
    body: "",
    kind: "relato",
    language: "es",
    visibility: "comunidad" as Visibility,
    community: "",
    place_name: "",
    latitude: "",
    longitude: "",
    is_sensitive: false,
    allow_comments: true,
    tags: "",
  });
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/entrar");
  }, [loading, user, router]);

  useEffect(() => {
    if (!editId) return;
    void api
      .story(editId)
      .then((data) => {
        setStory(data);
        setForm({
          title: data.title,
          summary: data.summary,
          body: data.body,
          kind: data.kind,
          language: data.language,
          visibility: data.visibility,
          community: data.community ? String(data.community) : "",
          place_name: data.location?.place_name ?? "",
          latitude: data.location?.latitude ? String(data.location.latitude) : "",
          longitude: data.location?.longitude ? String(data.location.longitude) : "",
          is_sensitive: data.is_sensitive,
          allow_comments: data.allow_comments,
          tags: data.tags.map((tag) => tag.name).join(", "),
        });
      })
      .catch((err) => setErrors({ detail: (err as Error).message }));
  }, [editId]);

  const sensitiveConflict = useMemo(
    () => form.is_sensitive && (form.visibility === "publico" || form.visibility === "registrado"),
    [form.is_sensitive, form.visibility]
  );

  if (loading) return <Spinner />;
  if (!user) return null;

  const payload = () => ({
    title: form.title,
    summary: form.summary,
    body: form.body,
    kind: form.kind,
    language: form.language,
    visibility: form.visibility,
    community: form.community ? Number(form.community) : null,
    place_name: form.place_name,
    latitude: form.latitude || null,
    longitude: form.longitude || null,
    is_sensitive: form.is_sensitive,
    allow_comments: form.allow_comments,
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  });

  const save = async () => {
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      const saved = story
        ? await api.updateStory(story.id, payload())
        : await api.createStory(payload());
      setStory(saved);
      setMessage("Guardado como borrador.");
      return saved;
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors());
      else setErrors({ detail: (err as Error).message });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const sendToReview = async () => {
    const target = story ?? (await save());
    if (!target) return;
    setSaving(true);
    try {
      setStory(await api.sendToReview(target.id));
      setMessage(
        "Enviado a revisión. La autoridad de su comunidad registrará la " +
          "autorización y decidirá si se publica."
      );
    } catch (err) {
      setErrors({ detail: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          {story ? "Editar publicación" : "Publicar en el muro"}
        </h1>
        <p className="text-sm text-sierra-600">
          Nada se publica directamente: primero queda en borrador, se registra la
          autorización de la comunidad y una autoridad decide si se publica.
        </p>
      </header>

      <CareNote>
        Solo comparta relatos, voces, fotografías, prácticas o conocimientos que la
        comunidad haya autorizado. Algunos saberes son colectivos, restringidos o
        reservados: no se graban, transcriben ni publican sin consentimiento.
      </CareNote>

      {errors.detail && <ErrorBox>{errors.detail}</ErrorBox>}
      {message && (
        <p className="rounded-lg border border-monte-300 bg-monte-50 px-4 py-3 text-sm text-monte-700">
          {message}
        </p>
      )}

      <section className="space-y-5 rounded-xl border border-sierra-200 bg-white p-6">
        <h2 className="font-semibold">1. El contenido</h2>

        <Field label="Título" error={errors.title}>
          <input
            className={inputClass}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </Field>

        <Field label="Resumen" hint="Una o dos líneas para el muro." error={errors.summary}>
          <input
            className={inputClass}
            value={form.summary}
            onChange={(event) => setForm({ ...form, summary: event.target.value })}
          />
        </Field>

        <Field label="Contenido" error={errors.body}>
          <textarea
            className={inputClass}
            rows={8}
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Tipo">
            <select
              className={inputClass}
              value={form.kind}
              onChange={(event) => setForm({ ...form, kind: event.target.value })}
            >
              {Object.entries(KIND_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lengua">
            <select
              className={inputClass}
              value={form.language}
              onChange={(event) => setForm({ ...form, language: event.target.value })}
            >
              <option value="es">Español</option>
              <option value="iku">Ika (Iku)</option>
              <option value="bilingue">Bilingüe</option>
            </select>
          </Field>
          <Field label="Etiquetas" hint="Separadas por coma.">
            <input
              className={inputClass}
              value={form.tags}
              onChange={(event) => setForm({ ...form, tags: event.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-sierra-200 bg-white p-6">
        <h2 className="font-semibold">2. Quién puede verlo</h2>

        <Field label="Comunidad" error={errors.community}>
          <select
            className={inputClass}
            value={form.community}
            onChange={(event) => setForm({ ...form, community: event.target.value })}
          >
            <option value="">Sin comunidad</option>
            {myCommunities.map((membership) => (
              <option key={membership.community} value={membership.community}>
                {membership.community_name}
              </option>
            ))}
          </select>
        </Field>
        {myCommunities.length === 0 && (
          <p className="text-sm text-sierra-600">
            No pertenece a ninguna comunidad todavía.{" "}
            <Link href="/comunidades" className="text-monte-700 underline">
              Solicitar ingreso
            </Link>
            .
          </p>
        )}

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-sierra-800">Visibilidad</legend>
          {VISIBILITIES.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-sierra-200 p-3 hover:bg-sierra-50 has-checked:border-monte-500 has-checked:bg-monte-50"
            >
              <input
                type="radio"
                name="visibility"
                className="mt-1"
                checked={form.visibility === option.value}
                onChange={() => setForm({ ...form, visibility: option.value })}
              />
              <span>
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-sierra-600">{option.help}</span>
              </span>
            </label>
          ))}
          {errors.visibility && (
            <p className="text-xs text-tierra-600">{errors.visibility}</p>
          )}
        </fieldset>

        <label className="flex items-start gap-3 rounded-lg border border-tierra-300 bg-tierra-100/40 p-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.is_sensitive}
            onChange={(event) =>
              setForm({ ...form, is_sensitive: event.target.checked })
            }
          />
          <span>
            <span className="block text-sm font-medium">Contenido sensible</span>
            <span className="block text-xs text-sierra-600">
              Saber colectivo, restringido o con una ubicación que no debe divulgarse. La
              ubicación exacta deja de mostrarse y no aparece en el mapa.
            </span>
          </span>
        </label>
        {sensitiveConflict && (
          <ErrorBox>
            Un contenido sensible no puede ser de uso abierto ni para todas las personas
            registradas: elija «Solo la comunidad» o «Acceso restringido».
          </ErrorBox>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.allow_comments}
            onChange={(event) =>
              setForm({ ...form, allow_comments: event.target.checked })
            }
          />
          Permitir comentarios
        </label>
      </section>

      <section className="space-y-5 rounded-xl border border-sierra-200 bg-white p-6">
        <h2 className="font-semibold">3. Ubicación (opcional)</h2>
        <p className="text-sm text-sierra-600">
          Use una ubicación general. No registre sitios sagrados ni lugares que la
          comunidad haya pedido no divulgar.
        </p>
        <Field label="Lugar">
          <input
            className={inputClass}
            placeholder="Nabusímake, Pueblo Bello (Cesar)"
            value={form.place_name}
            onChange={(event) => setForm({ ...form, place_name: event.target.value })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitud" error={errors.latitude}>
            <input
              className={inputClass}
              value={form.latitude}
              onChange={(event) => setForm({ ...form, latitude: event.target.value })}
            />
          </Field>
          <Field label="Longitud" error={errors.longitude}>
            <input
              className={inputClass}
              value={form.longitude}
              onChange={(event) => setForm({ ...form, longitude: event.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-monte-300 bg-monte-50 p-6">
        <h2 className="font-semibold">4. Qué pasa después</h2>
        <ol className="space-y-2 text-sm text-sierra-700">
          <li>
            <strong>1.</strong> Guarda el borrador y lo envía a revisión.
          </li>
          <li>
            <strong>2.</strong> La autoridad de su comunidad, o la administración del
            archivo, registra <strong>quién autoriza</strong> el contenido, en qué
            calidad, con qué alcance y bajo qué condiciones.
          </li>
          <li>
            <strong>3.</strong> Con esa autorización registrada, decide si se publica.
          </li>
        </ol>
        <p className="text-sm text-sierra-600">
          Quien escribe una historia no certifica su propio permiso: por eso la
          autorización no se diligencia aquí. Sin ella, la plataforma no deja publicar.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-sierra-200 pt-6">
        <Button onClick={save} disabled={saving || !form.title.trim() || sensitiveConflict}>
          {saving ? "Guardando…" : "Guardar borrador"}
        </Button>
        <Button
          variant="ghost"
          onClick={sendToReview}
          disabled={saving || !form.title.trim() || sensitiveConflict}
        >
          Enviar a revisión
        </Button>
        {story && (
          <Link
            href={`/historia/${story.id}`}
            className="text-sm text-monte-700 underline"
          >
            Ver cómo quedó
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PublicarPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PublicarContenido />
    </Suspense>
  );
}
