import type { Bounds, Place } from "../services/catalog";
export type MapCanvasProps = {
  styleUrl: string;
  places: Place[];
  onBounds: (bounds: Bounds) => void;
  onSelect: (id: string) => void;
  onPick?: (longitude: number, latitude: number) => void;
  center?: [number, number];
};
