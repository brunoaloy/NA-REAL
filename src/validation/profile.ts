export function profileInput(input: {
  name: string;
  bio: string;
  handle?: string;
}) {
  const display_name = input.name.trim(),
    bio = input.bio.trim(),
    handle = (input.handle ?? "").trim().toLowerCase();
  if (!display_name || display_name.length > 80)
    throw new Error("Informe seu nome, com até 80 caracteres.");
  if (bio.length > 300)
    throw new Error("Sua descrição pode ter até 300 caracteres.");
  if (handle && !/^[a-z0-9_]{3,30}$/.test(handle))
    throw new Error(
      "Use de 3 a 30 letras, números ou _ no seu nome de usuário.",
    );
  return { display_name, bio, handle: handle || null };
}
