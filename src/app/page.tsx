"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CareNote, Spinner, StoryCard } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ArchiveSectionSummary, Story } from "@/lib/types";

export default function Inicio() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [sections, setSections] = useState<ArchiveSectionSummary[]>([]);

  useEffect(() => {
    void api
      .stories({ ordering: "-published_at" })
      .then((page) => setStories(page.results.slice(0, 3)))
      .catch(() => setStories([]));
    void api.sections().then(setSections).catch(() => setSections([]));
  }, [user]);

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-2xl border border-sierra-200 bg-white">
        <div className="space-y-5 px-6 py-10 sm:px-10 sm:py-14">
          <p className="text-xs font-medium tracking-widest text-tierra-500 uppercase">
            Pueblo indígena Arhuaco (Iku) · Sierra Nevada de Santa Marta
          </p>
          <h1 className="serif max-w-2xl text-3xl leading-tight font-semibold sm:text-4xl">
            La memoria de nuestros mayores, el conocimiento de nuestras generaciones.
          </h1>
          <p className="max-w-2xl text-sierra-700">
            Memorias Vivas reúne, organiza y facilita la consulta de las memorias, los
            relatos y los conocimientos que la comunidad decida compartir. Es una
            herramienta de apoyo: no reemplaza la voz de los mayores ni la autoridad de la
            comunidad sobre sus conocimientos.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/muro"
              className="rounded-lg bg-monte-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-monte-700"
            >
              Ver el muro
            </Link>
            <Link
              href="/archivo"
              className="rounded-lg border border-sierra-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-sierra-100"
            >
              Recorrer el archivo
            </Link>
            {!user && (
              <Link
                href="/registro"
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-monte-700 underline hover:text-monte-600"
              >
                Crear una cuenta
              </Link>
            )}
          </div>
        </div>
      </section>

      <CareNote>
        El archivo solo incorpora relatos, voces, fotografías, prácticas o conocimientos
        que la comunidad autorice compartir. Sin iniciar sesión se ve únicamente el
        contenido de uso abierto; lo demás requiere pertenecer a la comunidad o tener un
        permiso explícito.
      </CareNote>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold">Lo último en el muro</h2>
          <Link href="/muro" className="text-sm text-monte-700 hover:underline">
            Ver todo
          </Link>
        </div>
        {stories === null ? (
          <Spinner />
        ) : stories.length === 0 ? (
          <p className="text-sm text-sierra-600">
            Todavía no hay contenido disponible para su nivel de acceso.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Secciones del archivo</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <li key={section.id}>
              <Link
                href={`/archivo/${section.slug}`}
                className="block h-full rounded-xl border border-sierra-200 bg-white p-4 transition-colors hover:border-monte-300 hover:bg-monte-50"
              >
                <span className="text-xs text-sierra-400">{section.number}</span>
                <span className="mt-0.5 block font-medium">{section.title}</span>
                {section.lead && (
                  <span className="mt-1 block text-sm text-sierra-600">
                    {section.lead}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
