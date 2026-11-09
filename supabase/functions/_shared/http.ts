import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { headers } from "./cors.ts";
export { headers } from "./cors.ts";
export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}
export function clients(req: Request) {
  const url = Deno.env.get("SUPABASE_URL")!;
  return {
    admin: createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    }),
    caller: createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
      auth: { persistSession: false },
    }),
  };
}
export async function verified(req: Request) {
  const c = clients(req);
  const { data, error } = await c.caller.auth.getUser();
  if (error || !data.user) throw new Error("UNAUTHORIZED");
  return { ...c, user: data.user };
}
export function preflight(req: Request) {
  return req.method === "OPTIONS" ? new Response(null, { headers }) : null;
}
