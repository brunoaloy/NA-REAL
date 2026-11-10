import { sessionLifecycle } from "../validation/session-lifecycle";
import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const lifecycle = sessionLifecycle<Session | null>(setSession);
    void supabase?.auth
      .getSession()
      .then((r) => {
        lifecycle.initial(r.data.session);
      })
      .catch(() => lifecycle.initial(null));
    const sub = supabase?.auth.onAuthStateChange((_event, session) =>
      lifecycle.changed(session),
    );
    return () => {
      lifecycle.dispose();
      sub?.data.subscription.unsubscribe();
    };
  }, []);
  return session;
}
