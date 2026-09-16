import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { type FleetRoute } from "../data/mock";
import { boundsOf, pointOnPath, splitPath, type LngLat } from "../lib/geo";

const LOOP_MS = 18000;
const PITCH = 35;
const STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
/** Dark edge under every route so it reads over streets and water alike. */
const CASING = "#040a18";

const TRUCK_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`;

function lineData(coords: LngLat[]) {
  const fallback: LngLat = coords[0] ?? [0, 0];
  const coordinates = coords.length >= 2 ? coords : [fallback, fallback];
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "LineString" as const, coordinates },
  };
}

/** Only trucks on the road move; loading and planned ones wait at the depot. */
const moves = (route: FleetRoute) => route.status === "Em rota";
const planned = (route: FleetRoute) => route.status === "Planejada";

/** Ring around the truck badge: the same status colours as the badges in the routes table. */
export const STATUS_RING: Record<FleetRoute["status"], string> = {
  "Em rota": "#34d399",
  Carregando: "#fbbf24",
  Planejada: "#94a3b8",
};

type Stop = { key: string; kind: "origin" | "destination"; label: string; at: LngLat; color: string; routeIds: string[] };

/** Route endpoints; a depot shared by several routes is one stop. */
function stopsOf(routes: FleetRoute[]): Stop[] {
  const stops = new Map<string, Stop>();
  routes.forEach((route) => {
    const ends: [Stop["kind"], string, LngLat][] = [
      ["origin", route.origin, route.path[0]],
      ["destination", route.destination, route.path[route.path.length - 1]],
    ];
    ends.forEach(([kind, label, at]) => {
      const key = `${kind}:${at.join(",")}`;
      const existing = stops.get(key);
      if (existing) existing.routeIds.push(route.id);
      else stops.set(key, { key, kind, label, at, color: route.color, routeIds: [route.id] });
    });
  });
  return [...stops.values()];
}

export function FleetMap({
  routes,
  selectedId,
  reduce,
  onSelect,
}: {
  routes: FleetRoute[];
  selectedId: string | null;
  reduce: boolean;
  onSelect: (id: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markers = useRef<Record<string, Marker>>({});
  const stopMarkers = useRef<{ stop: Stop; marker: Marker }[]>([]);
  const loaded = useRef(false);
  const selected = useRef(selectedId);
  selected.current = selectedId;

  function applySelection() {
    const map = mapRef.current;
    if (!map || !loaded.current) return;
    const current = selected.current;
    routes.forEach((route) => {
      const src = `route-${route.id}`;
      const focus = current === route.id;
      const faded = current !== null && !focus;
      map.setPaintProperty(`${src}-glow`, "line-opacity", faded ? 0 : focus ? 0.4 : planned(route) ? 0.08 : 0.22);
      map.setPaintProperty(`${src}-glow`, "line-width", focus ? 16 : 12);
      map.setPaintProperty(`${src}-casing`, "line-opacity", faded ? 0.35 : 0.9);
      map.setPaintProperty(`${src}-remain`, "line-opacity", faded ? 0.25 : planned(route) && !focus ? 0.7 : 1);
      map.setPaintProperty(`${src}-remain`, "line-width", focus ? 5 : 4);
      map.setPaintProperty(`${src}-passed`, "line-opacity", faded ? 0.12 : 0.38);
      map.setPaintProperty(`${src}-passed`, "line-width", focus ? 5 : 4);
      const el = markers.current[route.id]?.getElement();
      if (el) {
        el.classList.toggle("truck-selected", focus);
        el.classList.toggle("truck-faded", faded);
        el.setAttribute("aria-pressed", String(focus));
      }
    });
    // One delivery is named at a time, like a single trip card: the selected route, or the
    // one on the road. Other endpoints stay as dots, so nearby depots never pile up labels.
    const live = routes.filter(moves).map((r) => r.id);
    stopMarkers.current.forEach(({ stop, marker }) => {
      const el = marker.getElement();
      const focus = current !== null && stop.routeIds.includes(current);
      const labelled = current !== null ? focus : stop.routeIds.some((id) => live.includes(id));
      el.classList.toggle("is-focus", focus);
      el.classList.toggle("is-labelled", labelled);
      el.classList.toggle("is-faded", current !== null && !focus);
      // A truck waiting at this depot already marks the spot: its badge replaces the dot.
      const parked = stop.kind === "origin" && routes.some((r) => !moves(r) && stop.routeIds.includes(r.id));
      el.classList.toggle("has-parked-truck", parked);
    });
  }

  useEffect(() => {
    if (!host.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: host.current,
      style: STYLE,
      center: [-60.0217, -3.119],
      zoom: 11.4,
      pitch: PITCH,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    mapRef.current = map;

    map.on("load", () => {
      map.fitBounds(boundsOf(routes.map((r) => r.path)), { padding: 72, pitch: PITCH, duration: 0 });

      routes.forEach((route) => {
        const src = `route-${route.id}`;
        const round = { "line-cap": "round", "line-join": "round" } as const;
        map.addSource(`${src}-full`, { type: "geojson", data: lineData(route.path) });
        map.addSource(`${src}-passed`, { type: "geojson", data: lineData([route.path[0], route.path[0]]) });
        map.addSource(`${src}-remain`, { type: "geojson", data: lineData(route.path) });
        map.addLayer({
          id: `${src}-glow`,
          type: "line",
          source: `${src}-remain`,
          layout: round,
          paint: { "line-color": route.color, "line-width": 12, "line-blur": 8, "line-opacity": 0.22 },
        });
        map.addLayer({
          id: `${src}-casing`,
          type: "line",
          source: `${src}-full`,
          layout: round,
          paint: { "line-color": CASING, "line-width": 8, "line-opacity": 0.9 },
        });
        // Travelled road: the same line, dimmed.
        map.addLayer({
          id: `${src}-passed`,
          type: "line",
          source: `${src}-passed`,
          layout: round,
          paint: { "line-color": route.color, "line-width": 4, "line-opacity": 0.38 },
        });
        // Road ahead: solid; a planned route that has not left yet is dashed.
        map.addLayer({
          id: `${src}-remain`,
          type: "line",
          source: `${src}-remain`,
          layout: round,
          paint: {
            "line-color": route.color,
            "line-width": 4,
            "line-opacity": 1,
            ...(planned(route) ? { "line-dasharray": [1.2, 1.6] } : {}),
          },
        });
      });

      // Endpoints first, so trucks stack above them.
      stopMarkers.current = stopsOf(routes).map((stop) => {
        const el = document.createElement("div");
        el.className = `route-stop route-stop-${stop.kind}`;
        el.style.setProperty("--route", stop.color);
        const dot = document.createElement("span");
        dot.className = "route-stop-dot";
        const label = document.createElement("span");
        label.className = "route-stop-label";
        label.textContent = stop.label;
        el.append(dot, label);
        const marker = new maplibregl.Marker({ element: el, anchor: "center", pitchAlignment: "viewport", rotationAlignment: "viewport" })
          .setLngLat(stop.at)
          .addTo(map);
        return { stop, marker };
      });

      routes.forEach((route) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "truck-marker" + (moves(route) ? " truck-live" : "");
        el.style.setProperty("--truck", route.color);
        el.style.setProperty("--status", STATUS_RING[route.status]);
        el.setAttribute("aria-label", `${route.truck}, rota ${route.id}, ${route.status.toLowerCase()}`);
        el.setAttribute("aria-pressed", "false");
        const badge = document.createElement("span");
        badge.className = "truck-badge";
        badge.innerHTML = TRUCK_ICON;
        el.append(badge);
        el.addEventListener("click", () => onSelect(route.id));

        const start = pointOnPath(route.path, moves(route) ? 0.18 : 0);
        markers.current[route.id] = new maplibregl.Marker({
          element: el,
          anchor: "center",
          // A badge, not an arrow: it stays upright and faces the viewer at any tilt or bearing.
          pitchAlignment: "viewport",
          rotationAlignment: "viewport",
        })
          .setLngLat(start.pos)
          .addTo(map);
      });

      // Start with the attribution folded into its "i" button; it opens on demand.
      host.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");

      loaded.current = true;
      applySelection();
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markers.current = {};
      stopMarkers.current = [];
      loaded.current = false;
    };
  }, [routes, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const frame = () => {
      applySelection();
      const route = routes.find((r) => r.id === selectedId);
      const bounds = boundsOf(route ? [route.path] : routes.map((r) => r.path));
      // Keep whatever tilt the user has set; the map opens at PITCH.
      map.fitBounds(bounds, { padding: route ? 96 : 72, pitch: map.getPitch(), duration: reduce ? 0 : 420 });
    };
    if (loaded.current) frame();
    else map.once("load", frame);
  }, [selectedId, routes, reduce]);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const cycle = ((now - t0) % LOOP_MS) / LOOP_MS;
      const outbound = cycle < 0.5;
      const t = outbound ? cycle * 2 : 2 - cycle * 2;
      const map = mapRef.current;
      routes.filter(moves).forEach((route) => {
        const marker = markers.current[route.id];
        if (!marker) return;
        marker.setLngLat(pointOnPath(route.path, t).pos);
        if (!map) return;
        const { before, after } = splitPath(route.path, t);
        const src = `route-${route.id}`;
        (map.getSource(`${src}-passed`) as GeoJSONSource | undefined)?.setData(lineData(outbound ? before : after));
        (map.getSource(`${src}-remain`) as GeoJSONSource | undefined)?.setData(lineData(outbound ? after : before));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [routes, reduce]);

  return <div ref={host} className="fleet-map" role="region" aria-label="Mapa das rotas de entrega" />;
}
