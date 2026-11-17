import { describe, expect, it } from "vitest";
import { shippingFees, checkoutSchema, validatedCheckoutSchema, safeDestination, allowedOrderStatuses } from "@/lib/commerce";
describe("Marketplace rules", () => {
  it('rejects a bank channel for QRIS', () => expect(validatedCheckoutSchema.safeParse({ items: [{ variant_id: '00000000-0000-4000-8000-000000000001', quantity: 1 }], shipping: { name: 'Buyer', phone: '0812345678', address: 'Street 1', city: 'Jakarta', postal: '12345' }, courier: 'standard', method: 'qris', channel: 'BCA' }).success).toBe(false));
  it("offers standard, express and free pickup", () => expect(shippingFees).toEqual({ standard: 25000, express: 50000, pickup: 0 }));
  it("rejects zero quantity", () => expect(checkoutSchema.safeParse({ items: [{ variant_id: "00000000-0000-4000-8000-000000000001", quantity: 0 }], shipping: { name: "Buyer", phone: "0812345678", address: "Street 1", city: "Jakarta", postal: "12345" }, courier: "pickup", method: "cod", channel: "" }).success).toBe(false));
  it("prevents unpaid orders being shipped", () => expect(allowedOrderStatuses("pending_payment")).toEqual(["cancelled"]));
  it("prevents external login redirects", () => { expect(safeDestination("//evil.test")).toBeUndefined(); expect(safeDestination("/account")).toBe("/account"); });
});