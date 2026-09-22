import { z } from "zod";

export const reservaSchema = z.object({
  responsable: z.string().trim().min(3, "¿quién reserva?"),
  motivo: z.string().trim().min(3, "contá para qué"),
  inicio: z.coerce.date(),
  fin: z.coerce.date(),
}).refine(
  (r) => r.fin > r.inicio,
  {
    message: "el fin debe ser después del inicio",
    path: ["fin"],
  }
);