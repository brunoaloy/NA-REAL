import { useQuery } from "@tanstack/react-query";
import { db } from "../services/supabase";
export function useModerator(uid?: string) {
  return useQuery({
    queryKey: ["moderator-access", uid],
    enabled: Boolean(uid),
    queryFn: async () => {
      const r = await db().rpc("safe_is_admin");
      if (r.error) throw r.error;
      return r.data === true;
    },
  });
}
