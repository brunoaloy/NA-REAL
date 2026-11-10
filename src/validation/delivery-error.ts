export function uncertainWrite(error: unknown) {
  const e = error as {
    message?: unknown;
    name?: unknown;
    status?: unknown;
  } | null;
  return (
    (typeof e?.message === "string" &&
      /network|failed to fetch|fetch failed|timeout|timed out/i.test(
        e.message,
      )) ||
    e?.name === "AbortError" ||
    (typeof e?.status === "number" && (e.status === 0 || e.status >= 500))
  );
}
export class UnconfirmedPlaceDelivery extends Error {
  constructor() {
    super(
      "Não conseguimos confirmar o cadastro. Ele pode ter chegado: confira seus cadastros no Perfil antes de enviar novamente.",
    );
    this.name = "UnconfirmedPlaceDelivery";
  }
}
