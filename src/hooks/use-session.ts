import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    let mounted = true;
    void supabase?.auth.getSession().then((r) => {
      if (mounted) setSession(r.data.session);
    });
    const sub = supabase?.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => {
      mounted = false;
      sub?.data.subscription.unsubscribe();
    };
  }, []);
  return session;
}
