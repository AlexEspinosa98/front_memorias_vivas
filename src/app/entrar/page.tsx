"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, ErrorBox, Field, inputClass } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function EntrarPage() {
  const router = useRouter();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/muro");
  }, [user, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      router.push("/muro");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-sm text-sierra-600">
          El contenido reservado a la comunidad requiere iniciar sesión.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-xl border border-sierra-200 bg-white p-6"
      >
        {error && <ErrorBox>{error}</ErrorBox>}
        <Field label="Correo">
          <input
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Contraseña">
          <input
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="text-center text-sm text-sierra-600">
        ¿No tiene cuenta?{" "}
        <Link href="/registro" className="text-monte-700 underline">
          Crear una
        </Link>
      </p>
    </div>
  );
}
