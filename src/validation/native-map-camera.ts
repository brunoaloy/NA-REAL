export type NativeRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
export function nativeMapRegion(center?: [number, number]): NativeRegion {
  return {
    longitude: center?.[0] ?? -51,
    latitude: center?.[1] ?? -15,
    latitudeDelta: center ? 0.012 : 39,
    longitudeDelta: center ? 0.012 : 40,
  };
}
export function zoomNativeRegion(
  region: NativeRegion,
  factor: number,
): NativeRegion {
  const clamp = (value: number) => Math.max(0.0015, Math.min(80, value));
  return {
    ...region,
    latitudeDelta: clamp(region.latitudeDelta * factor),
    longitudeDelta: clamp(region.longitudeDelta * factor),
  };
}
export function nativeMapCamera(
  center: [number, number] | undefined,
  animate: (region: NativeRegion) => void = () => {},
) {
  let ready = false,
    target = nativeMapRegion(center),
    current = target;
  function focus() {
    if (ready) {
      current = target;
      animate(target);
    }
  }
  return {
    animator(next: (region: NativeRegion) => void) {
      animate = next;
    },
    ready() {
      ready = true;
      focus();
    },
    target(center?: [number, number]) {
      target = nativeMapRegion(center);
      focus();
    },
    region(region: NativeRegion) {
      current = region;
    },
    zoom(factor: number) {
      if (ready) {
        current = zoomNativeRegion(current, factor);
        animate(current);
      }
    },
    focus,
  };
}
