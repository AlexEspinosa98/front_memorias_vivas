"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/muro", label: "Muro" },
  { href: "/archivo", label: "Archivo" },
  { href: "/comunidades", label: "Comunidades" },
  { href: "/mapa", label: "Mapa" },
  { href: "/preguntar", label: "Preguntar" },
  { href: "/acerca", label: "Acerca de" },
];

export default function Nav() {
  const { user, signOut, canModerate } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [...LINKS];
  if (canModerate) links.push({ href: "/revision", label: "Revisión" });

  return (
    <header className="sticky top-0 z-20 border-b border-sierra-200 bg-sierra-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0" aria-label="Memorias Vivas, inicio">
          {/* En pantallas angostas solo cabe el emblema; desde sm, el logo completo. */}
          <Image
            src="/logo-emblema.png"
            alt=""
            width={512}
            height={512}
            priority
            className="h-10 w-10 sm:hidden"
          />
          <Image
            src="/logo-horizontal.png"
            alt="Memorias Vivas · Un puente entre generaciones"
            width={1145}
            height={240}
            priority
            className="hidden h-10 w-auto sm:block lg:h-11"
          />
        </Link>

        <nav aria-label="Principal" className="ml-auto hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-monte-100 font-medium text-monte-700"
                    : "text-sierra-700 hover:bg-sierra-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {user ? (
            <>
              <Link
                href="/publicar"
                className="hidden rounded-lg bg-monte-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-monte-700 sm:inline-block"
              >
                Publicar
              </Link>
              <Link
                href="/perfil"
                className="hidden text-sm text-sierra-700 hover:underline sm:inline"
              >
                {user.display_name}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="text-sm text-sierra-500 hover:text-tierra-600"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                href="/entrar"
                className="rounded-lg border border-sierra-300 bg-white px-3 py-1.5 text-sm hover:bg-sierra-100"
              >
                Entrar
              </Link>
              <Link
                href="/registro"
                className="hidden rounded-lg bg-monte-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-monte-700 sm:inline-block"
              >
                Crear cuenta
              </Link>
            </>
          )}
          <button
            type="button"
            aria-expanded={open}
            aria-label="Menú"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg border border-sierra-300 px-2 py-1.5 text-sm lg:hidden"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Principal (móvil)" className="border-t border-sierra-200 lg:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {[...links, ...(user ? [{ href: "/publicar", label: "Publicar" }, { href: "/perfil", label: "Mi perfil" }] : [])].map(
              (link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded px-2 py-2 text-sm text-sierra-700 hover:bg-sierra-100"
                  >
                    {link.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
