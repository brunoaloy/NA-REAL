const operations = ["catalogue", "nearby", "photo_upload"] as const;
type Operation = (typeof operations)[number];
type Category = "network" | "permission" | "service" | "unknown";
export type Diagnostic = {
  time: string;
  operation: Operation;
  category: Category;
};
export function createDiagnostics() {
  let events: Diagnostic[] = [];
  return {
    record(operation: Operation, error: unknown) {
      if (!operations.includes(operation)) return;
      const e = error as {
        code?: unknown;
        message?: unknown;
        status?: unknown;
      } | null;
      const category: Category =
        e?.code === "42501" || e?.status === 401 || e?.status === 403
          ? "permission"
          : typeof e?.message === "string" &&
              /network|fetch|timeout|timed out/i.test(e.message)
            ? "network"
            : typeof e?.status === "number" && e.status >= 500
              ? "service"
              : "unknown";
      events = [
        ...events.slice(-19),
        { time: new Date().toISOString(), operation, category },
      ];
    },
    snapshot() {
      return events.map((event) => ({ ...event }));
    },
    clear() {
      events = [];
    },
  };
}
export const localDiagnostics = createDiagnostics();
export function diagnosticReport(events: readonly Diagnostic[]) {
  return [
    "Diagnóstico local (opcional):",
    ...events.map((v) => `${v.time} · ${v.operation} · ${v.category}`),
  ].join("\n");
}
