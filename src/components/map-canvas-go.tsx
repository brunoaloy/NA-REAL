import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  nativeMapCamera,
  nativeMapRegion,
} from "../validation/native-map-camera";
import MapView, { Marker } from "react-native-maps";
import { regionBounds } from "../validation/map-runtime";
import type { MapCanvasProps } from "./map-canvas.types";
export default function ExpoGoMap(p: MapCanvasProps) {
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [camera] = useState(() => nativeMapCamera(p.center));
  useEffect(() => {
    camera.animator((region) => map.current?.animateToRegion(region, 250));
  }, [camera]);
  useEffect(() => camera.target(p.center), [camera, p.center]);
  return (
    <View
      style={{
        height: 420,
        width: "100%",
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      <MapView
        ref={map}
        accessibilityLabel="Mapa interativo de lugares"
        style={{ height: 420, width: "100%", borderRadius: 18 }}
        mapType="standard"
        loadingEnabled
        showsPointsOfInterests={true}
        pointsOfInterestFilter={[]}
        onMapReady={() => {
          setReady(true);
          camera.ready();
        }}
        showsBuildings
        onPress={
          p.onPick
            ? (event) => {
                const { longitude, latitude } = event.nativeEvent.coordinate;
                p.onPick?.(longitude, latitude);
              }
            : undefined
        }
        initialRegion={nativeMapRegion(p.center)}
        onRegionChangeComplete={(region) => {
          camera.region(region);
          p.onBounds(regionBounds(region));
        }}
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
      <View
        style={{
          position: "absolute",
          right: 10,
          top: 12,
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#DFE9E3",
          overflow: "hidden",
        }}
      >
        {(
          [
            {
              label: "Aproximar mapa",
              icon: "add",
              action: () => camera.zoom(0.5),
            },
            {
              label: "Afastar mapa",
              icon: "remove",
              action: () => camera.zoom(2),
            },
            {
              label: "Centralizar mapa",
              icon: "locate-outline",
              action: () => camera.focus(),
            },
          ] as const
        ).map((control) => (
          <Pressable
            key={control.label}
            accessibilityRole="button"
            accessibilityLabel={control.label}
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={control.action}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              opacity: ready ? 1 : 0.4,
            }}
          >
            <Ionicons name={control.icon} size={23} color="#0F766E" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
