import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import Nav from "@/components/Nav";
import { AuthProvider } from "@/lib/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: "Memorias Vivas · Un puente entre generaciones",
  description:
    "Archivo digital y muro comunitario del pueblo Arhuaco (Iku). Los contenidos se publican solo con autorización de la comunidad.",
  openGraph: {
    title: "Memorias Vivas · Un puente entre generaciones",
    description:
      "Archivo digital y muro comunitario del pueblo Arhuaco (Iku). Los contenidos se publican solo con autorización de la comunidad.",
    locale: "es_CO",
    type: "website",
    images: [{ url: "/logo-memorias-vivas.png", width: 886, height: 1024 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO">
      <body>
        <AuthProvider>
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2"
          >
            Ir al contenido
          </a>
          <Nav />
          <main id="contenido" className="mx-auto max-w-6xl px-4 py-8">
            {children}
          </main>
          <footer className="mt-16 border-t border-sierra-200 bg-white/60">
            <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-sm text-sierra-600">
              <p className="flex items-center gap-2.5 font-medium text-sierra-800">
                <Image
                  src="/logo-emblema.png"
                  alt=""
                  width={512}
                  height={512}
                  className="h-8 w-8 shrink-0"
                />
                Memorias Vivas · Proyecto ALUNA IA
              </p>
              <p>
                Este archivo no sustituye la consulta directa con el pueblo Arhuaco ni la
                revisión de sus autoridades. Solo incorpora relatos, voces, fotografías,
                prácticas o conocimientos que la comunidad autorice compartir.
              </p>
              <p className="text-xs text-sierra-500">
                Algunos saberes pueden ser colectivos, restringidos o reservados; no se
                graban, transcriben ni publican sin consentimiento.
              </p>
              <p className="pt-2">
                <Link href="/acerca" className="text-monte-700 underline">
                  Acerca del archivo, criterios de cuidado cultural y fuentes
                </Link>
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
