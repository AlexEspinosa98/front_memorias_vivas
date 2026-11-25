"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button, CareNote, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AssistantAnswer } from "@/lib/types";

interface Turno {
  pregunta: string;
  respuesta: AssistantAnswer | null;
}

const EJEMPLOS = [
  "¿Cómo se aprende a tejer la mochila?",
  "¿Qué se cultiva en la Sierra Nevada?",
  "¿Por qué se dice Iku y no solo Arhuaco?",
  "¿Qué comunidades hay en el archivo?",
];

const AVISO_ESTADO: Record<string, string> = {
  vedada: "border-tierra-300 bg-tierra-100/60",
  sin_datos: "border-sierra-300 bg-sierra-100",
  no_disponible: "border-sierra-300 bg-sierra-100",
  limite: "border-sierra-300 bg-sierra-100",
};

export default function PreguntarPage() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [pregunta, setPregunta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turnos, enviando]);

  const preguntar = async (texto: string) => {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setPregunta("");
    setTurnos((actuales) => [...actuales, { pregunta: limpio, respuesta: null }]);
    setEnviando(true);
    try {
      const respuesta = await api.ask(limpio);
      setTurnos((actuales) =>
        actuales.map((t, i) => (i === actuales.length - 1 ? { ...t, respuesta } : t))
      );
    } catch (err) {
      setTurnos((actuales) =>
        actuales.map((t, i) =>
          i === actuales.length - 1
            ? {
                ...t,
                respuesta: {
                  estado: "no_disponible",
                  respuesta: (err as Error).message,
                  fuentes: [],
                },
              }
            : t
        )
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Preguntar al archivo</h1>
        <p className="text-sm text-sierra-600">
          Responde únicamente con lo que el archivo tiene autorizado y que usted
          puede ver, y cita siempre de dónde lo sacó. Si algo no está, lo dice en
          vez de completarlo.
        </p>
      </header>

      <CareNote>
        Hay temas que el asistente no responde: pagamentos, sitios sagrados, la
        Línea Negra y la Ley de Origen. Su comprensión pertenece a la tradición y
        a las autoridades propias, no a una explicación escrita.
        {!user && (
          <>
            {" "}
            Sin iniciar sesión, responde solo con el contenido de uso abierto.
          </>
        )}
      </CareNote>

      {turnos.length === 0 && (
        <section className="space-y-3">
          <p className="text-sm font-medium text-sierra-700">Pruebe con:</p>
          <ul className="flex flex-wrap gap-2">
            {EJEMPLOS.map((ejemplo) => (
              <li key={ejemplo}>
                <button
                  type="button"
                  onClick={() => preguntar(ejemplo)}
                  className="rounded-full border border-sierra-300 bg-white px-3 py-1.5 text-sm text-sierra-700 hover:border-monte-300 hover:bg-monte-50"
                >
                  {ejemplo}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ol className="space-y-5">
        {turnos.map((turno, index) => (
          <li key={index} className="space-y-3">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-monte-600 px-4 py-2 text-sm text-white">
              {turno.pregunta}
            </p>

            {turno.respuesta === null ? (
              <p className="text-sm text-sierra-500" role="status">
                Buscando en el archivo…
              </p>
            ) : (
              <div
                className={`space-y-3 rounded-2xl rounded-bl-sm border px-4 py-3 ${
                  AVISO_ESTADO[turno.respuesta.estado] ??
                  "border-sierra-200 bg-white"
                }`}
              >
                <div className="prosa text-sm text-sierra-800">
                  {turno.respuesta.respuesta.split("\n\n").map((parrafo, i) => (
                    <p key={i}>{parrafo}</p>
                  ))}
                </div>

                {turno.respuesta.fuentes.length > 0 && (
                  <div className="border-t border-sierra-200 pt-2">
                    <p className="mb-1 text-xs font-medium text-sierra-600">
                      Fuentes
                    </p>
                    <ul className="space-y-1 text-xs">
                      {turno.respuesta.fuentes.map((fuente) => (
                        <li key={fuente.numero}>
                          <Link
                            href={fuente.url}
                            className="text-monte-700 underline"
                          >
                            [{fuente.numero}] {fuente.titulo}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
        <div ref={finRef} />
      </ol>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void preguntar(pregunta);
        }}
        className="sticky bottom-4 flex gap-2 rounded-xl border border-sierra-200 bg-white p-2 shadow-sm"
      >
        <input
          className={`${inputClass} border-0 focus:ring-0`}
          placeholder="Escriba su pregunta sobre el archivo…"
          value={pregunta}
          maxLength={500}
          onChange={(event) => setPregunta(event.target.value)}
        />
        <Button type="submit" disabled={enviando || !pregunta.trim()}>
          {enviando ? "…" : "Preguntar"}
        </Button>
      </form>

      <p className="text-center text-xs text-sierra-500">
        Cada consulta queda registrada para que la comunidad pueda revisar qué
        responde el sistema en su nombre. El asistente no reemplaza la consulta
        directa con las autoridades.
      </p>
    </div>
  );
}
