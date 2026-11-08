import { useRef } from "react";
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
  type CameraRef,
  type GeoJSONSourceRef,
} from "@maplibre/maplibre-react-native";
import { featureCollection } from "../services/catalog";
import type { MapCanvasProps } from "./map-canvas.types";
export default function MapCanvas(p: MapCanvasProps) {
  const camera = useRef<CameraRef>(null);
  const source = useRef<GeoJSONSourceRef>(null);
  return (
    <Map
      style={{ height: 420, width: "100%" }}
      mapStyle={p.styleUrl}
      attribution
      onRegionDidChange={(e) => p.onBounds(e.nativeEvent.bounds)}
      onPress={
        p.onPick
          ? (e) => {
              const [longitude, latitude] = e.nativeEvent.lngLat;
              p.onPick?.(longitude, latitude);
            }
          : undefined
      }
      onLongPress={(e) => {
        const [x, y] = e.nativeEvent.lngLat;
        p.onPick?.(x, y);
      }}
    >
      <Camera
        ref={camera}
        initialViewState={{
          center: p.center ?? [-51, -15],
          zoom: p.center ? 13 : 3,
        }}
        {...(p.center ? { center: p.center, zoom: 13 } : {})}
      />
      {p.selectedPoint && (
        <GeoJSONSource
          id="chosen-location"
          data={{
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Point",
                  coordinates: [
                    p.selectedPoint.longitude,
                    p.selectedPoint.latitude,
                  ],
                },
              },
            ],
          }}
        >
          <Layer
            id="chosen-location-dot"
            type="circle"
            paint={{
              "circle-color": "#3882F6",
              "circle-radius": 13,
              "circle-stroke-color": "#FFFFFF",
              "circle-stroke-width": 3,
            }}
          />
        </GeoJSONSource>
      )}
      <GeoJSONSource
        id="places"
        ref={source}
        data={featureCollection(p.places)}
        cluster
        clusterRadius={45}
        onPress={async (e) => {
          const f = e.nativeEvent.features[0];
          if (f?.properties?.cluster && f.geometry.type === "Point") {
            const zoom = await source.current?.getClusterExpansionZoom(
              f.properties.cluster_id,
            );
            camera.current?.flyTo({
              center: f.geometry.coordinates as [number, number],
              zoom: zoom ?? 10,
              duration: 300,
            });
          } else if (f?.properties?.id) p.onSelect(f.properties.id);
        }}
      >
        <Layer
          id="clusters"
          type="circle"
          filter={["has", "point_count"]}
          paint={{ "circle-color": "#0F766E", "circle-radius": 24 }}
        />
        <Layer
          id="cluster-count"
          type="symbol"
          filter={["has", "point_count"]}
          layout={{
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 13,
          }}
          paint={{ "text-color": "#FFFFFF" }}
        />
        <Layer
          id="points"
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{
            "circle-color": [
              "case",
              ["==", ["get", "id"], p.selectedId ?? ""],
              "#084F48",
              "#10B981",
            ],
            "circle-radius": [
              "case",
              ["==", ["get", "id"], p.selectedId ?? ""],
              14,
              10,
            ],
            "circle-stroke-color": "white",
            "circle-stroke-width": 3,
          }}
        />
      </GeoJSONSource>
    </Map>
  );
}
