import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { preferredCity, type CityPreference } from "../validation/cities";
const key = "@nareal/discovery-city/v1";
let writes: Promise<unknown> = Promise.resolve();
const listeners = new Set<
  (value: CityPreference | null, source: symbol) => void
>();
export function usePreferredCity(
  onRestore?: (value: CityPreference | null) => void,
  onExternalChange?: (value: CityPreference | null) => void,
) {
  const restore = useRef(onRestore),
    externalChange = useRef(onExternalChange),
    instance = useRef(Symbol("city-preference"));
  const revision = useRef(0);
  const [city, setCity] = useState<CityPreference | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const initialRevision = revision.current;
    const receive = (value: CityPreference | null, source: symbol) => {
      if (source === instance.current) return;
      revision.current++;
      setCity(value);
      setError("");
      externalChange.current?.(value);
    };
    listeners.add(receive);
    void AsyncStorage.getItem(key)
      .then((raw) => {
        if (active && revision.current === initialRevision) {
          try {
            const value = preferredCity(JSON.parse(raw ?? "null"));
            setCity(value);
            restore.current?.(value);
          } catch {
            setCity(null);
          }
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Sua última cidade não pôde ser recuperada. Você pode escolher novamente.",
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      listeners.delete(receive);
    };
  }, []);
  async function save(value: CityPreference | null) {
    revision.current++;
    const next = preferredCity(value);
    setCity(next);
    setError("");
    for (const receive of listeners) receive(next, instance.current);
    const operation = writes
      .catch(() => undefined)
      .then(() =>
        next
          ? AsyncStorage.setItem(key, JSON.stringify(next))
          : AsyncStorage.removeItem(key),
      );
    writes = operation;
    try {
      await operation;
    } catch {
      setError(
        "A cidade foi aplicada nesta sessão, mas não conseguimos lembrar para a próxima vez.",
      );
    }
  }
  return { city, ready, error, save };
}
