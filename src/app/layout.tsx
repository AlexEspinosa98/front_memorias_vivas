import type { Metadata } from "next";

import Nav from "@/components/Nav";
import { AuthProvider } from "@/lib/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: "Memorias Vivas · Un puente entre generaciones",
  description:
    "Archivo digital y muro comunitario del pueblo Arhuaco (Iku). Los contenidos se publican solo con autorización de la comunidad.",
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
              <p className="font-medium text-sierra-800">
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
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
