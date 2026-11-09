// Presentation gate only; Supabase still authorizes every queue read/decision.
export function moderationAccess(
  signedIn: boolean,
  role: { isPending: boolean; isError: boolean; data?: boolean },
): "login" | "checking" | "unavailable" | "denied" | "granted" {
  if (!signedIn) return "login";
  if (role.isPending) return "checking";
  if (role.isError) return "unavailable";
  return role.data === true ? "granted" : "denied";
}
