import { useEffect, useRef } from "react";
import MapView, { Marker } from "react-native-maps";
import { regionBounds } from "../validation/map-runtime";
import type { MapCanvasProps } from "./map-canvas.types";
export default function ExpoGoMap(p: MapCanvasProps) {
  const map = useRef<MapView>(null);
  useEffect(() => {
    if (p.center) {
      map.current?.animateToRegion({
        longitude: p.center[0],
        latitude: p.center[1],
        longitudeDelta: 0.05,
        latitudeDelta: 0.05,
      });
    }
  }, [p.center]);
  return (
    <MapView
      ref={map}
      accessibilityLabel="Mapa interativo de lugares"
      style={{ height: 420, width: "100%", borderRadius: 18 }}
      showsPointsOfInterests
      showsBuildings
      onPress={
        p.onPick
          ? (event) => {
              const { longitude, latitude } = event.nativeEvent.coordinate;
              p.onPick?.(longitude, latitude);
            }
          : undefined
      }
      initialRegion={{
        longitude: p.center?.[0] ?? -51,
        latitude: p.center?.[1] ?? -15,
        longitudeDelta: p.center ? 0.05 : 40,
        latitudeDelta: p.center ? 0.05 : 39,
      }}
      onRegionChangeComplete={(region) => p.onBounds(regionBounds(region))}
      onLongPress={(event) => {
        const { longitude, latitude } = event.nativeEvent.coordinate;
        p.onPick?.(longitude, latitude);
      }}
    >
      {p.selectedPoint && (
        <Marker
          coordinate={p.selectedPoint}
          title="Entrada do lugar"
          pinColor="#3882F6"
          draggable
          onDragEnd={(event) => {
            const { longitude, latitude } = event.nativeEvent.coordinate;
            p.onPick?.(longitude, latitude);
          }}
        />
      )}
      {p.places
        .filter((place) => place.latitude != null && place.longitude != null)
        .map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude!,
              longitude: place.longitude!,
            }}
            accessibilityLabel={"Selecionar " + place.name}
            title={place.name}
            description={`${place.category} · ${place.city}, ${place.state}`}
            pinColor={p.selectedId === place.id ? "#084F48" : "#0F766E"}
            onPress={() =>
              p.onPick
                ? p.onPick(place.longitude!, place.latitude!)
                : p.onSelect(place.id)
            }
          />
        ))}
    </MapView>
  );
}
