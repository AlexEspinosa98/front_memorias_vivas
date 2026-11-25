"use client";

import "leaflet/dist/leaflet.css";

import type { Map as LeafletMap, Marker } from "leaflet";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { MapPoint } from "@/lib/types";

import { KIND_LABEL } from "./ui";

/**
 * Mapa real de las historias ubicadas.
 *
 * Leaflet se carga dentro de `useEffect` porque necesita `window`: importarlo
 * arriba rompería el render del servidor.
 *
 * Solo recibe puntos que la API ya filtró: el contenido marcado como sensible
 * nunca llega aquí, así que no hay nada que ocultar en el cliente.
 */
export default function MapaHistorias({
  points,
  activeId,
  onHover,
}: {
  points: MapPoint[];
  activeId: number | null;
  onHover: (id: number | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<number, Marker>>(new Map());
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelado = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 17,
        attribution:
          '&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const icono = (destacado: boolean) =>
        L.divIcon({
          className: "",
          html: `<span style="
            display:block;width:${destacado ? 20 : 14}px;height:${destacado ? 20 : 14}px;
            border-radius:9999px;border:3px solid #fff;
            background:${destacado ? "#b3713f" : "#3d6440"};
            box-shadow:0 1px 4px rgba(0,0,0,.45);"></span>`,
          iconSize: [destacado ? 20 : 14, destacado ? 20 : 14],
          iconAnchor: [destacado ? 10 : 7, destacado ? 10 : 7],
        });

      for (const point of points) {
        const marker = L.marker([point.latitude, point.longitude], {
          icon: icono(false),
          title: point.title,
        }).addTo(map);

        marker.bindPopup(
          `<div style="min-width:190px;font-family:system-ui,sans-serif">
             <div style="font-size:11px;color:#7d745b;text-transform:uppercase;letter-spacing:.04em">
               ${escapar(KIND_LABEL[point.kind] ?? point.kind)}
             </div>
             <a href="/historia/${point.id}" style="display:block;margin:2px 0 4px;font-weight:600;color:#2f4d32">
               ${escapar(point.title)}
             </a>
             ${
               point.place_name
                 ? `<div style="font-size:12px;color:#4a442f">📍 ${escapar(point.place_name)}</div>`
                 : ""
             }
             ${
               point.community
                 ? `<div style="font-size:12px;color:#7d745b">${escapar(point.community)}</div>`
                 : ""
             }
           </div>`
        );

        marker.on("mouseover", () => onHover(point.id));
        marker.on("mouseout", () => onHover(null));
        markersRef.current.set(point.id, marker);
      }

      if (points.length === 1) {
        map.setView([points[0].latitude, points[0].longitude], 11);
      } else if (points.length > 1) {
        map.fitBounds(
          L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number])),
          { padding: [48, 48], maxZoom: 10 }
        );
      } else {
        // Sin puntos: encuadre general de la Sierra Nevada de Santa Marta.
        map.setView([10.83, -73.68], 8);
      }

      setListo(true);
    })();

    return () => {
      cancelado = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [points, onHover]);

  // Resalta el marcador de la historia sobre la que está el cursor en la lista.
  useEffect(() => {
    if (!listo) return;
    void (async () => {
      const L = (await import("leaflet")).default;
      for (const [id, marker] of markersRef.current) {
        const destacado = id === activeId;
        marker.setIcon(
          L.divIcon({
            className: "",
            html: `<span style="
              display:block;width:${destacado ? 20 : 14}px;height:${destacado ? 20 : 14}px;
              border-radius:9999px;border:3px solid #fff;
              background:${destacado ? "#b3713f" : "#3d6440"};
              box-shadow:0 1px 4px rgba(0,0,0,.45);"></span>`,
            iconSize: [destacado ? 20 : 14, destacado ? 20 : 14],
            iconAnchor: [destacado ? 10 : 7, destacado ? 10 : 7],
          })
        );
      }
    })();
  }, [activeId, listo]);

  return (
    <div className="overflow-hidden rounded-xl border border-sierra-200 bg-white">
      <div
        ref={containerRef}
        className="h-[420px] w-full bg-sierra-100 lg:h-[520px]"
        role="application"
        aria-label="Mapa de las historias ubicadas en la Sierra Nevada de Santa Marta"
      />
      <p className="border-t border-sierra-100 px-4 py-2 text-xs text-sierra-500">
        {points.length} ubicación(es). Las coordenadas son del lugar general que indicó
        quien publicó; el contenido marcado como sensible no aparece aquí.{" "}
        <Link href="/acerca" className="underline">
          Cómo funciona el acceso
        </Link>
      </p>
    </div>
  );
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
