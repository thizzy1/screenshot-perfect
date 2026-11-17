import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validatedCheckoutSchema } from "./commerce";
import { z } from 'zod';

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => validatedCheckoutSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("place_order", { _items: data.items, _shipping: data.shipping, _courier: data.courier, _payment_method: data.method, _payment_channel: data.channel });
    if (error) throw new Error(error.message);
    return id;
  });

export const payOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("simulate_payment", { _checkout: data });
    if (error) throw new Error(error.message);
  });