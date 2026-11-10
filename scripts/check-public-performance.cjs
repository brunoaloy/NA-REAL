// Public catalogue only. No account, precise location, content or tokens in output.
const { readEnvironment } = require("./setup-mobile.cjs");
(async () => {
  const env = { ...readEnvironment(process.cwd()), ...process.env };
  const base = env.EXPO_PUBLIC_SUPABASE_URL,
    key =
      env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error("Public configuration missing");
  const samples = [];
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    const r = await fetch(base + "/rest/v1/rpc/search_places", {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({
        term: "",
        category_filter: "Todos",
        city_filter: "",
        state_filter: "",
        page_number: 0,
        west: -74,
        south: -34,
        east: -34,
        north: 6,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await r.json();
    if (!r.ok || !Array.isArray(data)) throw new Error("Catalogue unavailable");
    samples.push(Math.round(performance.now() - start));
  }
  console.log(
    JSON.stringify({
      operation: "public_catalogue_page_0",
      requests: 3,
      milliseconds: samples,
      median_ms: [...samples].sort((a, b) => a - b)[1],
      scope:
        "Current execution environment and network; not iPhone startup or rendering.",
    }),
  );
})().catch(() => {
  console.error(
    "Public catalogue benchmark did not complete; credentials and response omitted.",
  );
  process.exitCode = 1;
});
