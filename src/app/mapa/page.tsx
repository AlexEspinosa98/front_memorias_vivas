"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CareNote, Empty, ErrorBox, KIND_LABEL, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { MapPoint } from "@/lib/types";

/** Recuadro aproximado de la Sierra Nevada de Santa Marta y su entorno. */
const BOUNDS = { minLat: 10.0, maxLat: 11.6, minLng: -74.6, maxLng: -72.8 };
const WIDTH = 720;
const HEIGHT = 520;

function project(point: MapPoint) {
  const x =
    ((point.longitude - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * WIDTH;
  const y =
    HEIGHT - ((point.latitude - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * HEIGHT;
  return { x, y };
}

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

  const inBounds = useMemo(
    () =>
      (points ?? []).filter(
        (point) =>
          point.latitude >= BOUNDS.minLat &&
          point.latitude <= BOUNDS.maxLat &&
          point.longitude >= BOUNDS.minLng &&
          point.longitude <= BOUNDS.maxLng
      ),
    [points]
  );

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!points) return <Spinner />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Mapa</h1>
        <p className="max-w-2xl text-sm text-sierra-600">
          Ubicaciones generales de las historias que pueden mostrarse. Las coordenadas son
          referenciales dentro de la Sierra Nevada de Santa Marta y su entorno.
        </p>
      </header>

      <CareNote>
        El mapa no incluye el contenido marcado como sensible ni la ubicación de sitios
        sagrados. El Decreto 0514 de 2026 reconoce la Línea Negra como un sistema de
        espacios sagrados de especial protección: su ubicación y significado no se
        divulgan en este archivo.
      </CareNote>

      {inBounds.length === 0 ? (
        <Empty title="No hay ubicaciones para mostrar">
          Puede que existan historias con lugar, pero sin coordenadas o marcadas como
          sensibles.
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <figure className="overflow-hidden rounded-xl border border-sierra-200 bg-white">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-auto w-full"
              role="img"
              aria-label="Ubicaciones aproximadas de las historias en la Sierra Nevada de Santa Marta"
            >
              <rect width={WIDTH} height={HEIGHT} fill="var(--color-sierra-100)" />
              {/* Cuadrícula de referencia de grados. */}
              {[0.25, 0.5, 0.75].map((fraction) => (
                <g key={fraction} stroke="var(--color-sierra-200)" strokeWidth="1">
                  <line x1={WIDTH * fraction} y1={0} x2={WIDTH * fraction} y2={HEIGHT} />
                  <line x1={0} y1={HEIGHT * fraction} x2={WIDTH} y2={HEIGHT * fraction} />
                </g>
              ))}
              {/* Macizo, como referencia visual aproximada. */}
              <ellipse
                cx={WIDTH * 0.5}
                cy={HEIGHT * 0.45}
                rx={WIDTH * 0.3}
                ry={HEIGHT * 0.27}
                fill="var(--color-monte-100)"
                stroke="var(--color-monte-300)"
                strokeDasharray="6 6"
              />
              <text
                x={WIDTH * 0.5}
                y={HEIGHT * 0.45}
                textAnchor="middle"
                fontSize="14"
                fill="var(--color-monte-600)"
              >
                Sierra Nevada de Santa Marta
              </text>

              {inBounds.map((point) => {
                const { x, y } = project(point);
                const isActive = active === point.id;
                return (
                  <g key={point.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 11 : 7}
                      fill={isActive ? "var(--color-tierra-500)" : "var(--color-monte-600)"}
                      stroke="white"
                      strokeWidth="2"
                      onMouseEnter={() => setActive(point.id)}
                      onMouseLeave={() => setActive(null)}
                      style={{ cursor: "pointer" }}
                    />
                    {isActive && (
                      <text
                        x={x + 14}
                        y={y + 4}
                        fontSize="13"
                        fill="var(--color-sierra-900)"
                      >
                        {point.title}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <figcaption className="px-4 py-2 text-xs text-sierra-500">
              Representación esquemática, no cartográfica. {inBounds.length} ubicación(es).
            </figcaption>
          </figure>

          <ul className="space-y-3">
            {inBounds.map((point) => (
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
                <h2 className="mt-0.5 font-medium">
                  <Link href={`/historia/${point.id}`} className="hover:underline">
                    {point.title}
                  </Link>
                </h2>
                {point.place_name && (
                  <p className="mt-1 text-sm text-sierra-600">{point.place_name}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
