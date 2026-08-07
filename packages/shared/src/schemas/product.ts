import { z } from "zod";

export const productSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  totalStock: z.number().int().nonnegative(),
});

export type Product = z.infer<typeof productSchema>;
