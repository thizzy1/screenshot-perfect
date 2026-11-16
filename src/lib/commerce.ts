import { z } from "zod";

export const shippingFees = { standard: 25000, express: 50000, pickup: 0 } as const;
export const checkoutSchema = z.object({
  items: z.array(z.object({ variant_id: z.string().uuid(), quantity: z.number().int().min(1).max(100) })).min(1),
  shipping: z.object({ name: z.string().trim().min(2), phone: z.string().trim().min(8), address: z.string().trim().min(5), city: z.string().trim().min(2), postal: z.string().regex(/^\d{5}$/) }),
  courier: z.enum(["standard", "express", "pickup"]),
  method: z.enum(["qris", "bank_transfer", "ewallet", "cod"]),
  channel: z.string(),
});
export function safeDestination(value?: string) {
  return value && /^\/(?!\/)/.test(value) && !value.includes("\\") && !value.startsWith("/auth") ? value : undefined;
}
export function allowedOrderStatuses(status: string) {
  if (status === "pending_payment") return ["cancelled"];
  if (status === "paid") return ["processing", "cancelled"];
  if (status === "processing") return ["shipped", "cancelled"];
  if (status === "shipped") return ["completed"];
  return [];
}