import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { type FleetRoute } from "../data/mock";
import { boundsOf, pointOnPath, splitPath, type LngLat } from "../lib/geo";

const GRAY = "#64748b";

function lineData(coords: LngLat[]) {
  const fallback: LngLat = coords[0] ?? [0, 0];
  const coordinates = coords.length >= 2 ? coords : [fallback, fallback];
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "LineString" as const, coordinates },
  };
}

const LOOP_MS = 18000;
const STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

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
  const selected = useRef(selectedId);
  selected.current = selectedId;

  useEffect(() => {
    if (!host.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: host.current,
      style: STYLE,
      center: [-60.0217, -3.119],
      zoom: 11.4,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    mapRef.current = map;

    map.on("load", () => {
      const bounds = boundsOf(routes.map((r) => r.path));
      map.fitBounds(bounds, { padding: 56, duration: 0 });

      routes.forEach((route) => {
        const src = `route-${route.id}`;
        map.addSource(`${src}-passed`, {
          type: "geojson",
          data: lineData([route.path[0], route.path[0]]),
        });
        map.addSource(`${src}-remain`, {
          type: "geojson",
          data: lineData(route.path),
        });
        map.addLayer({
          id: `${src}-glow`,
          type: "line",
          source: `${src}-remain`,
          paint: {
            "line-color": route.color,
            "line-width": 6,
            "line-opacity": 0.22,
          },
        });
        map.addLayer({
          id: `${src}-passed`,
          type: "line",
          source: `${src}-passed`,
          paint: {
            "line-color": GRAY,
            "line-width": 2.5,
            "line-opacity": 0.85,
            "line-dasharray": [2, 1.4],
          },
        });
        map.addLayer({
          id: `${src}-remain`,
          type: "line",
          source: `${src}-remain`,
          paint: {
            "line-color": route.color,
            "line-width": 2.5,
            "line-opacity": 0.95,
            "line-dasharray": [2, 1.4],
          },
        });

        const el = document.createElement("button");
        el.type = "button";
        el.className =
          "truck-marker" + (route.status === "Em rota" ? " truck-live" : "");
        el.style.setProperty("--truck", route.color);
        el.setAttribute("aria-label", `${route.truck} · ${route.id}`);
        el.addEventListener("click", () => onSelect(route.id));

        const startT =
          route.status === "Em rota" ? 0.18 : route.status === "Carregando" ? 0.12 : 0;
        const start = pointOnPath(route.path, startT);
        const marker = new maplibregl.Marker({
          element: el,
          rotationAlignment: "map",
          pitchAlignment: "map",
          anchor: "center",
        })
          .setLngLat(start.pos)
          .setRotation(start.bearing)
          .addTo(map);
        markers.current[route.id] = marker;
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markers.current = {};
    };
  }, [routes, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const route = routes.find((r) => r.id === selectedId);
    if (!route) return;
    const fly = () => {
      const b = boundsOf([route.path]);
      map.fitBounds(b, { padding: 80, duration: reduce ? 0 : 420 });
    };
    if (map.isStyleLoaded()) fly();
    else map.once("load", fly);
  }, [selectedId, routes, reduce]);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const elapsed = now - t0;
      const map = mapRef.current;
      routes.forEach((route) => {
        const marker = markers.current[route.id];
        if (!marker) return;
        const cycle = (elapsed % LOOP_MS) / LOOP_MS;
        const outbound = cycle < 0.5;
        const t = outbound ? cycle * 2 : 2 - cycle * 2;
        const { pos, bearing } = pointOnPath(route.path, t);
        marker.setLngLat(pos);
        marker.setRotation(outbound ? bearing : (bearing + 180) % 360);
        if (!map) return;
        const { before, after } = splitPath(route.path, t);
        const passed = outbound ? before : after;
        const remain = outbound ? after : before;
        const src = `route-${route.id}`;
        (map.getSource(`${src}-passed`) as GeoJSONSource | undefined)?.setData(lineData(passed));
        (map.getSource(`${src}-remain`) as GeoJSONSource | undefined)?.setData(lineData(remain));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [routes, reduce]);

  return <div ref={host} className="fleet-map" role="img" aria-label="Mapa das rotas de entrega" />;
}
