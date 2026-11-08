import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapCanvasProps } from "./map-canvas.types";
import { featureCollection } from "../services/catalog";
import { ErrorState } from "./ui";
export default function MapCanvas(p: MapCanvasProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const props = useRef(p);
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    props.current = p;
  }, [p]);
  useEffect(() => {
    if (!container.current) return;
    let m: maplibregl.Map;
    try {
      maplibregl.setWorkerUrl(
        `/maplibre/${maplibregl.getVersion()}/maplibre-gl-worker.mjs`,
      );
      m = new maplibregl.Map({
        container: container.current,
        style: p.styleUrl,
        center: props.current.center ?? [-51, -15],
        zoom: props.current.center ? 13 : 3,
        attributionControl: { compact: true },
      });
      map.current = m;
    } catch (e) {
      queueMicrotask(() => setError(e));
      return;
    }
    m.addControl(new maplibregl.NavigationControl(), "top-right");
    m.on("error", () =>
      setError(
        new Error(
          "Não foi possível carregar o mapa. Verifique o provedor e use a lista.",
        ),
      ),
    );
    m.on("load", () => {
      m.addSource("places", {
        type: "geojson",
        data: featureCollection(props.current.places),
        cluster: true,
        clusterRadius: 45,
      });
      m.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: { "circle-color": "#0F766E", "circle-radius": 24 },
      });
      m.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 13,
        },
        paint: { "text-color": "#FFFFFF" },
      });
      m.addLayer({
        id: "points",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#10B981",
          "circle-radius": 9,
          "circle-stroke-color": "white",
          "circle-stroke-width": 3,
        },
      });
      m.on("click", "points", (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) props.current.onSelect(id);
      });
      m.on("click", "clusters", async (e) => {
        const f = e.features?.[0];
        if (f?.geometry.type === "Point") {
          const zoom = await (
            m.getSource("places") as maplibregl.GeoJSONSource
          ).getClusterExpansionZoom(f.properties.cluster_id);
          m.easeTo({
            center: f.geometry.coordinates as [number, number],
            zoom,
          });
        }
      });
      m.on("click", (e) => props.current.onPick?.(e.lngLat.lng, e.lngLat.lat));
      m.on("contextmenu", (e) =>
        props.current.onPick?.(e.lngLat.lng, e.lngLat.lat),
      );
      const b = m.getBounds();
      if (b)
        props.current.onBounds([
          b.getWest(),
          b.getSouth(),
          b.getEast(),
          b.getNorth(),
        ]);
    });
    m.on("moveend", () => {
      const b = m.getBounds();
      if (b)
        props.current.onBounds([
          Math.max(-180, b.getWest()),
          Math.max(-90, b.getSouth()),
          Math.min(180, b.getEast()),
          Math.min(90, b.getNorth()),
        ]);
    });
    return () => {
      map.current = null;
      m.remove();
    };
  }, [p.styleUrl]);
  useEffect(() => {
    const s = map.current?.getSource("places") as
      maplibregl.GeoJSONSource | undefined;
    s?.setData(featureCollection(p.places));
  }, [p.places]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const highlight = () => {
      if (!m.getLayer("points")) return;
      m.setPaintProperty("points", "circle-color", [
        "case",
        ["==", ["get", "id"], p.selectedId ?? ""],
        "#084F48",
        "#10B981",
      ]);
      m.setPaintProperty("points", "circle-radius", [
        "case",
        ["==", ["get", "id"], p.selectedId ?? ""],
        14,
        9,
      ]);
    };
    if (m.isStyleLoaded()) highlight();
    else m.once("idle", highlight);
    return () => {
      m.off("idle", highlight);
    };
  }, [p.selectedId]);
  useEffect(() => {
    if (p.center) map.current?.easeTo({ center: p.center, zoom: 13 });
  }, [p.center]);
  useEffect(() => {
    if (!p.selectedPoint || !map.current) return;
    const marker = new maplibregl.Marker({
      color: "#3882F6",
      draggable: Boolean(p.onPick),
    })
      .setLngLat([p.selectedPoint.longitude, p.selectedPoint.latitude])
      .addTo(map.current);
    marker.on("dragend", () => {
      const point = marker.getLngLat();
      props.current.onPick?.(point.lng, point.lat);
    });
    return () => {
      marker.remove();
    };
  }, [p.selectedPoint, p.onPick]);
  return (
    <>
      {error != null && <ErrorState error={error} />}
      <div
        ref={container}
        style={{ height: 420, width: "100%", borderRadius: 18 }}
        aria-label="Mapa interativo de lugares"
      />
    </>
  );
}
