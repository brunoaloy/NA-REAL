export type FunctionHealth = "available" | "missing" | "unavailable";
export function functionHealth(status: number): FunctionHealth {
  // Our deployed handlers reject unauthenticated GET with 405 before any writes.
  return status === 405
    ? "available"
    : status === 404
      ? "missing"
      : "unavailable";
}
export async function probeFunction(
  url: string,
  request: typeof fetch = fetch,
): Promise<FunctionHealth> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const r = await request(url, {
      method: "GET",
      signal: controller.signal,
    });
    return functionHealth(r.status);
  } catch {
    return "unavailable";
  } finally {
    clearTimeout(timer);
  }
}
