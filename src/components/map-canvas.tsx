/* eslint-disable @typescript-eslint/no-require-imports -- Native modules must stay lazy so Expo Go never evaluates MapLibre. */
import type { ComponentType } from "react";
import { builtInMap } from "../services/map-runtime";
import type { MapCanvasProps } from "./map-canvas.types";
// Keep require lazy: importing MapLibre at module scope crashes Expo Go before rendering.
const MapCanvas: ComponentType<MapCanvasProps> = builtInMap
  ? require("./map-canvas-go").default
  : require("./map-canvas-maplibre").default;
export default MapCanvas;
