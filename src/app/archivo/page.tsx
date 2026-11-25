"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CareNote, ErrorBox, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { ArchiveSectionSummary } from "@/lib/types";

export default function ArchivoPage() {
  const [sections, setSections] = useState<ArchiveSectionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .sections()
      .then(setSections)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!sections) return <Spinner />;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">El archivo</h1>
        <p className="max-w-2xl text-sm text-sierra-600">
          Información general de contexto sobre el pueblo Arhuaco (Iku), organizada para
          la consulta. No pretende representar la totalidad de su cultura ni constituir un
          archivo completo de sus conocimientos.
        </p>
      </header>

      <CareNote>
        La información se presenta de manera introductoria y se apoya en documentos
        institucionales, investigaciones y materiales de organizaciones. Antes de publicar
        contenidos nuevos se vuelven a consultar las fuentes.
      </CareNote>

      <ol className="space-y-3">
        {sections.map((section) => (
          <li key={section.id}>
            <Link
              href={`/archivo/${section.slug}`}
              className="flex gap-4 rounded-xl border border-sierra-200 bg-white p-5 transition-colors hover:border-monte-300 hover:bg-monte-50"
            >
              <span className="serif text-2xl text-sierra-300">{section.number}</span>
              <span>
                <span className="block font-medium">{section.title}</span>
                {section.lead && (
                  <span className="mt-1 block text-sm text-sierra-600">
                    {section.lead}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
