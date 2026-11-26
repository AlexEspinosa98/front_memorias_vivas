"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, CareNote, ErrorBox, Field, inputClass } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function RegistroPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [form, setForm] = useState({
    display_name: "",
    email: "",
    password: "",
    place: "",
  });
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await api.register({ ...form, accept_care_terms: accepted });
      await signIn(form.email, form.password);
      router.push("/muro");
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors());
      else setErrors({ detail: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-1">
        <Image
          src="/logo-emblema.png"
          alt=""
          width={512}
          height={512}
          priority
          className="mb-3 h-16 w-16"
        />
        <h1 className="text-2xl font-semibold">Crear una cuenta</h1>
        <p className="text-sm text-sierra-600">
          Con una cuenta puede ver el contenido para personas registradas, comentar y
          solicitar ingreso a una comunidad.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-xl border border-sierra-200 bg-white p-6"
      >
        {errors.detail && <ErrorBox>{errors.detail}</ErrorBox>}
        <Field label="Nombre visible" error={errors.display_name}>
          <input
            required
            className={inputClass}
            value={form.display_name}
            onChange={(event) =>
              setForm({ ...form, display_name: event.target.value })
            }
          />
        </Field>
        <Field label="Correo" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </Field>
        <Field
          label="Contraseña"
          hint="Mínimo 8 caracteres."
          error={errors.password}
        >
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClass}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </Field>
        <Field label="Lugar" hint="Opcional." error={errors.place}>
          <input
            className={inputClass}
            value={form.place}
            onChange={(event) => setForm({ ...form, place: event.target.value })}
          />
        </Field>

        <CareNote>
          Me comprometo a no grabar, transcribir ni publicar relatos, voces, fotografías,
          prácticas o conocimientos sin la autorización de la comunidad, y a respetar que
          algunos saberes son colectivos, restringidos o reservados.
        </CareNote>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          Acepto los criterios de cuidado cultural del archivo.
        </label>
        {errors.accept_care_terms && (
          <p className="text-xs text-tierra-600">{errors.accept_care_terms}</p>
        )}

        <Button type="submit" disabled={busy || !accepted} className="w-full">
          {busy ? "Creando…" : "Crear cuenta"}
        </Button>
      </form>

      <p className="text-center text-sm text-sierra-600">
        ¿Ya tiene cuenta?{" "}
        <Link href="/entrar" className="text-monte-700 underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
