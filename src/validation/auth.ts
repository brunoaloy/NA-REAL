export type AuthMode = "login" | "signup" | "reset";
export function authInput(
  mode: AuthMode,
  input: { email: string; password?: string; confirmation?: string },
) {
  const email = input.email.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Informe um e-mail válido para continuar.");
  const password = input.password ?? "";
  if (mode !== "reset" && !password)
    throw new Error("Informe sua senha para continuar.");
  if (mode === "signup") {
    if (password.length < 8)
      throw new Error("Use uma senha com pelo menos 8 caracteres.");
    if (password !== input.confirmation)
      throw new Error("As senhas não conferem. Confira a confirmação.");
  }
  return { email, password };
}
