import { z } from "zod";
export const placeInput = z
  .object({
    name: z.string().trim().min(3).max(120),
    category: z.enum(["Comer", "Lazer", "Compras", "Serviços"]),
    city: z.string().trim().min(2).max(100),
    state: z
      .string()
      .regex(
        /^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/,
      ),
    address: z.string().trim().min(5).max(240),
    description: z.string().trim().max(1000).default(""),
    is_public_venue: z.literal(true, {
      error: "Confirme que o lugar é um estabelecimento público.",
    }),
    latitude: z.number().min(-34).max(6).optional(),
    longitude: z.number().min(-74).max(-34).optional(),
  })
  .refine((v) => (v.latitude == null) === (v.longitude == null), {
    message: "Informe latitude e longitude juntas.",
  });
export const reviewInput = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(3).max(500),
});
export const messageInput = z.string().trim().min(1).max(1000);
export function isRecent(expiresAt: string, now = Date.now()) {
  return Date.parse(expiresAt) > now;
}

export const questionInput = z.object({
  kind: z.enum(["movement", "queue", "open", "parking", "other"]),
  body: z.string().trim().min(3).max(500),
});
