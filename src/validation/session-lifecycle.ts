/** Ignore initial session reads that finish after a newer auth event or unmount. */
export function sessionLifecycle<T>(publish: (value: T) => void) {
  let active = true,
    revision = 0;
  return {
    initial(value: T) {
      if (active && revision === 0) publish(value);
    },
    changed(value: T) {
      revision++;
      if (active) publish(value);
    },
    dispose() {
      active = false;
    },
  };
}
export function assertSessionOwner(
  actual: string | undefined,
  expected?: string,
) {
  if (!actual) throw new Error("Entre para contribuir.");
  if (expected && actual !== expected)
    throw new Error("Sua sessão mudou. Entre novamente antes de continuar.");
  return actual;
}
