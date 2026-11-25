"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CareNote, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { ArchiveSection, ArchiveSectionSummary } from "@/lib/types";

const KIND_LABEL: Record<string, string> = {
  institucional: "Fuentes institucionales",
  academica: "Fuentes académicas",
  organizacion: "Organizaciones indígenas",
  audiovisual: "Materiales audiovisuales",
  fotografica: "Fuentes fotográficas",
  norma: "Normas y decretos",
};

const ORDER = [
  "institucional",
  "organizacion",
  "academica",
  "norma",
  "audiovisual",
  "fotografica",
];

type Source = ArchiveSection["sources"][number];

export default function AcercaPage() {
  const [sections, setSections] = useState<ArchiveSectionSummary[]>([]);
  const [sources, setSources] = useState<Source[] | null>(null);

  useEffect(() => {
    void api.sections().then(setSections).catch(() => setSections([]));
    void api.sources().then(setSources).catch(() => setSources([]));
  }, []);

  const grouped = (sources ?? []).reduce<Record<string, Source[]>>((acc, source) => {
    (acc[source.kind] ??= []).push(source);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header className="space-y-3">
        <p className="text-xs font-medium tracking-widest text-tierra-500 uppercase">
          Acerca del archivo
        </p>
        <h1 className="serif text-3xl leading-tight font-semibold">
          Memorias Vivas: un puente entre generaciones
        </h1>
        <p className="text-lg text-sierra-700">
          Pueblo indígena Arhuaco (Iku) · Sierra Nevada de Santa Marta ·
          Magdalena, Cesar y La Guajira, Colombia
        </p>
      </header>

      <section className="prosa space-y-4 text-sierra-800">
        <h2 className="text-xl font-semibold">Qué es</h2>
        <p>
          Memorias Vivas es una propuesta de archivo digital con funciones de
          inteligencia artificial, pensada para organizar y facilitar la consulta de
          memorias, relatos y conocimientos del pueblo Arhuaco. Su propósito es
          contribuir a que estos contenidos puedan preservarse y transmitirse entre
          generaciones, siempre que su registro y divulgación cuenten con la
          autorización correspondiente.
        </p>
        <p>
          El archivo se plantea como una herramienta de apoyo. La tecnología no
          reemplaza la voz de los mayores ni la autoridad de la comunidad sobre sus
          conocimientos.
        </p>
      </section>

      <section className="prosa space-y-4 text-sierra-800">
        <h2 className="text-xl font-semibold">Qué no es</h2>
        <p>
          Este archivo no pretende representar la totalidad de la cultura Arhuaca ni
          constituir un registro completo de sus conocimientos. La información de
          contexto se presenta de manera introductoria y se apoya en documentos
          institucionales, investigaciones y materiales de organizaciones.
        </p>
        <p>
          Tampoco sustituye la consulta directa con el pueblo Arhuaco ni la revisión de
          sus autoridades. Varias secciones del archivo señalan de forma explícita lo
          que no se desarrolla y por qué.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cómo funciona el acceso</h2>
        <p className="text-sierra-700">
          Cada contenido se publica con un nivel de acceso que decide quien lo comparte,
          junto con la autoridad de su comunidad:
        </p>
        <dl className="space-y-3">
          {[
            [
              "Uso abierto",
              "Visible para cualquier persona, sin iniciar sesión.",
              "bg-monte-100 text-monte-700 border-monte-300",
            ],
            [
              "Personas registradas",
              "Solo para quienes tienen una cuenta en Memorias Vivas.",
              "bg-sierra-100 text-sierra-700 border-sierra-300",
            ],
            [
              "Solo la comunidad",
              "Solo para los miembros activos de la comunidad que publica.",
              "bg-tierra-100 text-tierra-600 border-tierra-300",
            ],
            [
              "Acceso restringido",
              "Solo para las personas a las que la autoridad concede permiso, una por una.",
              "bg-sierra-800 text-sierra-50 border-sierra-800",
            ],
          ].map(([label, help, style]) => (
            <div
              key={label}
              className="flex flex-col gap-1.5 rounded-xl border border-sierra-200 bg-white p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <dt>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
                >
                  {label}
                </span>
              </dt>
              <dd className="text-sm text-sierra-700">{help}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Criterio de cuidado cultural</h2>
        <CareNote>
          El archivo solo debe incorporar relatos, voces, fotografías, prácticas o
          conocimientos que la comunidad autorice compartir. Algunos saberes pueden ser
          colectivos, restringidos o reservados; no deben grabarse, transcribirse ni
          publicarse sin consentimiento.
        </CareNote>
        <div className="prosa space-y-4 text-sierra-800">
          <p>
            Esto no es solo una recomendación de uso: está en el funcionamiento de la
            plataforma. Ninguna historia puede publicarse sin que se registre antes
            quién la autorizó, en qué calidad, con qué alcance y bajo qué condiciones.
            Un contenido marcado como sensible no puede ser de uso abierto, no muestra
            su ubicación exacta y no aparece en el mapa.
          </p>
          <p>
            No se publica la ubicación ni el significado de los sitios sagrados. El
            Decreto 0514 de 2026 reconoce la Línea Negra como un sistema de espacios
            sagrados de especial protección y valor espiritual, cultural y ambiental
            para los pueblos de la Sierra Nevada.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Sobre la lengua y los nombres</h2>
        <div className="prosa space-y-4 text-sierra-800">
          <p>
            El pueblo Arhuaco se autoidentifica como Iku, palabra que suele traducirse
            como «gente» en su lengua. En documentos institucionales y académicos
            aparecen también las formas Ika, Ikʉ e Ijku. La denominación «Arhuaco» es de
            uso extendido en español, mientras que Iku corresponde a una forma de
            autodenominación; por respeto a esa identidad, aquí se usan las expresiones
            «pueblo Iku» o «pueblo Arhuaco».
          </p>
          <p>
            Antes de incorporar palabras, traducciones o audios en Ika, se verifican con
            hablantes o con materiales producidos y autorizados por la propia comunidad.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Las secciones del archivo</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {sections.map((section) => (
            <li key={section.id}>
              <Link
                href={`/archivo/${section.slug}`}
                className="flex gap-3 rounded-lg border border-sierra-200 bg-white px-4 py-2.5 text-sm transition-colors hover:border-monte-300 hover:bg-monte-50"
              >
                <span className="text-sierra-400">{section.number}</span>
                <span>{section.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold">Fuentes de información</h2>
        <p className="text-sm text-sierra-600">
          Se priorizaron instituciones públicas, organizaciones indígenas y repositorios
          académicos. Las referencias se consultan nuevamente antes de publicar
          contenidos, en especial cuando hay datos sensibles, cifras demográficas o
          asuntos sujetos a cambios normativos.
        </p>

        {sources === null ? (
          <Spinner />
        ) : (
          ORDER.filter((kind) => grouped[kind]?.length).map((kind) => (
            <div key={kind} className="space-y-2">
              <h3 className="text-sm font-semibold text-sierra-700">
                {KIND_LABEL[kind] ?? kind}
              </h3>
              <ul className="space-y-2 text-sm text-sierra-700">
                {grouped[kind].map((source) => (
                  <li key={source.id} className="border-l-2 border-sierra-200 pl-3">
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
            </div>
          ))
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-sierra-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Nota metodológica y de autorización</h2>
        <div className="prosa text-sierra-800">
          <p>
            Este archivo es una síntesis inicial para el diseño de un prototipo
            académico. No sustituye la consulta directa con el pueblo Arhuaco ni la
            revisión de sus autoridades. Antes de registrar, transcribir, clasificar o
            publicar memorias, relatos, fotografías, grabaciones o conocimientos, el
            equipo debe explicar el propósito del archivo, solicitar autorización y
            respetar las condiciones de acceso que defina la comunidad.
          </p>
          <p>
            La inteligencia artificial debe operar únicamente sobre contenidos cuyo uso
            haya sido permitido.
          </p>
        </div>
        <p className="border-t border-sierra-200 pt-4 text-sm text-sierra-500">
          Proyecto ALUNA IA · Universidad del Magdalena
        </p>
      </section>

      <nav className="flex flex-wrap gap-4 border-t border-sierra-200 pt-6 text-sm">
        <Link href="/muro" className="text-monte-700 underline">
          Ir al muro
        </Link>
        <Link href="/archivo" className="text-monte-700 underline">
          Recorrer el archivo
        </Link>
        <Link href="/comunidades" className="text-monte-700 underline">
          Ver las comunidades
        </Link>
      </nav>
    </div>
  );
}
