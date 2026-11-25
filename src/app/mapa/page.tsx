"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CareNote, Empty, ErrorBox, KIND_LABEL, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { MapPoint } from "@/lib/types";

// Leaflet necesita `window`, así que el mapa no se renderiza en el servidor.
const MapaHistorias = dynamic(() => import("@/components/MapaHistorias"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-xl border border-sierra-200 bg-sierra-100 text-sm text-sierra-500 lg:h-[520px]">
      Cargando el mapa…
    </div>
  ),
});

export default function MapaPage() {
  const { user } = useAuth();
  const [points, setPoints] = useState<MapPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    api
      .mapPoints()
      .then(setPoints)
      .catch((err: Error) => setError(err.message));
  }, [user]);

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!points) return <Spinner />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Mapa</h1>
        <p className="max-w-2xl text-sm text-sierra-600">
          El territorio del pueblo Arhuaco en la Sierra Nevada de Santa Marta, y las
          historias del muro que pueden mostrarse con su ubicación.
        </p>
      </header>

      <CareNote>
        El mapa no incluye el contenido marcado como sensible ni la ubicación de sitios
        sagrados. El Decreto 0514 de 2026 reconoce la Línea Negra como un sistema de
        espacios sagrados de especial protección: su ubicación y significado no se
        divulgan en este archivo.
      </CareNote>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Historias ubicadas</h2>

        {points.length === 0 ? (
          <Empty title="No hay ubicaciones para mostrar">
            Puede que existan historias con lugar, pero sin coordenadas o marcadas como
            sensibles.
          </Empty>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <MapaHistorias points={points} activeId={active} onHover={setActive} />

            <ul className="space-y-3">
              {points.map((point) => (
                <li
                  key={point.id}
                  onMouseEnter={() => setActive(point.id)}
                  onMouseLeave={() => setActive(null)}
                  className={`rounded-xl border bg-white p-4 transition-colors ${
                    active === point.id
                      ? "border-tierra-300 bg-tierra-100/40"
                      : "border-sierra-200"
                  }`}
                >
                  <p className="text-xs text-sierra-500">
                    {KIND_LABEL[point.kind] ?? point.kind}
                    {point.community && ` · ${point.community}`}
                  </p>
                  <h3 className="mt-0.5 font-medium">
                    <Link href={`/historia/${point.id}`} className="hover:underline">
                      {point.title}
                    </Link>
                  </h3>
                  {point.place_name && (
                    <p className="mt-1 text-sm text-sierra-600">
                      <span aria-hidden>📍 </span>
                      {point.place_name}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-3 pt-4">
        <h2 className="text-lg font-semibold">Mapa de referencia del territorio</h2>
        <figure className="overflow-hidden rounded-xl border border-sierra-200 bg-white">
          <a
            href="/mapa-resguardos-snsm.jpg"
            target="_blank"
            rel="noreferrer"
            title="Abrir el mapa en tamaño completo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mapa-resguardos-snsm.jpg"
              alt="Mapa de resguardos indígenas y figuras ambientales de la Sierra Nevada de Santa Marta: resguardos, Línea Negra, reserva forestal de la Ley 2 de 1959, parques nacionales naturales y corporaciones autónomas regionales."
              width={2000}
              height={1460}
              className="w-full bg-white object-contain"
              loading="lazy"
            />
          </a>
          <figcaption className="space-y-2 border-t border-sierra-100 px-4 py-3 text-sm">
            <p className="font-medium">
              Figura 3. Mapa de resguardos indígenas y figuras ambientales de la Sierra
              Nevada de Santa Marta
            </p>
            <p className="text-xs text-sierra-500">
              Nota. Mapa de delimitación de resguardos indígenas, reservas forestales,
              parques nacionales naturales y corporaciones autónomas regionales de la
              Sierra Nevada de Santa Marta. Fuente temática: Consejo Territorial de
              Cabildos de la Sierra Nevada de Santa Marta (2015); base cartográfica:
              Instituto Geográfico Agustín Codazzi (IGAC).
            </p>
            <p className="text-xs text-sierra-500">
              Fuente de apoyo: Procuraduría General de la Nación,{" "}
              <em>Caracterización general del pueblo indígena Arhuaco</em>; Ministerio de
              Cultura, caracterización Iku; Decreto 0514 de 2026.
            </p>
            <p className="text-xs text-sierra-400">
              Toque la imagen para verla en tamaño completo.
            </p>
          </figcaption>
        </figure>
      </section>
    </div>
  );
}
