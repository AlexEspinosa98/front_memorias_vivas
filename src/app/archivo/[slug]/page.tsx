"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CareNote, ErrorBox, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { ArchiveSection } from "@/lib/types";

export default function SeccionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [section, setSection] = useState<ArchiveSection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .section(slug)
      .then(setSection)
      .catch((err: Error) => setError(err.message));
  }, [slug]);

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!section) return <Spinner />;

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <nav className="text-sm">
        <Link href="/archivo" className="text-monte-700 hover:underline">
          ← El archivo
        </Link>
      </nav>

      <header className="space-y-2">
        <p className="text-sm text-sierra-400">Sección {section.number}</p>
        <h1 className="serif text-3xl leading-tight font-semibold">{section.title}</h1>
        {section.lead && <p className="text-lg text-sierra-700">{section.lead}</p>}
      </header>

      {section.body && (
        <div className="prosa text-sierra-800">
          {section.body.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}

      {section.care_note && <CareNote>{section.care_note}</CareNote>}

      {section.figures.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold">Figuras</h2>
          {section.figures.map((figure) => (
            <figure
              key={figure.id}
              className="overflow-hidden rounded-xl border border-sierra-200 bg-white"
            >
              {(figure.image || figure.external_url) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={figure.image ?? figure.external_url}
                  alt={figure.caption}
                  className="w-full object-cover"
                />
              )}
              <figcaption className="space-y-1 px-4 py-3 text-sm">
                <p className="font-medium">
                  {figure.number ? `Figura ${figure.number}. ` : ""}
                  {figure.caption}
                </p>
                {figure.note && (
                  <p className="text-xs text-sierra-500">Nota. {figure.note}</p>
                )}
              </figcaption>
            </figure>
          ))}
        </section>
      )}

      {section.sources.length > 0 && (
        <section className="space-y-3 border-t border-sierra-200 pt-6">
          <h2 className="text-lg font-semibold">Fuentes de apoyo</h2>
          <ul className="space-y-2 text-sm text-sierra-700">
            {section.sources.map((source) => (
              <li key={source.id}>
                {source.citation}
                {source.url && (
                  <>
                    {" "}
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-monte-700 underline"
                    >
                      Abrir
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
