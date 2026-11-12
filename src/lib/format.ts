export function formatIDR(value: number | null | undefined) {
  return "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(value ?? 0));
}

export const COURIERS = {
  standard: { label: "Standard Shipping", eta: "3-5 days", fee: 25000 },
  express: { label: "Express Shipping", eta: "1-2 days", fee: 50000 },
  pickup: { label: "Pickup in Store", eta: "Ready in 24h", fee: 0 },
} as const;
export type Courier = keyof typeof COURIERS;

export const PAYMENT_METHODS = {
  qris: { label: "QRIS", hint: "Scan with any banking or e-wallet app", channels: ["QRIS"] },
  bank_transfer: { label: "Bank Transfer (Virtual Account)", hint: "Pay via ATM, mobile or internet banking", channels: ["BCA", "BNI", "BRI", "Mandiri"] },
  ewallet: { label: "E-Wallet", hint: "Pay with your e-wallet balance", channels: ["GoPay", "OVO", "DANA", "ShopeePay"] },
  cod: { label: "Cash on Delivery", hint: "Pay the courier when your order arrives", channels: ["COD"] },
} as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const ORDER_STATUS: Record<string, { label: string; tone: "muted" | "warning" | "success" | "brand" | "info" }> = {
  pending_payment: { label: "Awaiting payment", tone: "warning" },
  paid: { label: "Paid", tone: "info" },
  processing: { label: "Processing", tone: "info" },
  shipped: { label: "Shipped", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "brand" },
};

export const TRACK_STEPS = ["pending_payment", "paid", "processing", "shipped", "completed"] as const;

/** Index of the furthest tracker step reached. COD orders skip payment and start at processing. */
export function trackIndex(status: string) {
  const i = TRACK_STEPS.indexOf(status as (typeof TRACK_STEPS)[number]);
  return i;
}

export function shippingFee(courier: Courier) {
  return COURIERS[courier].fee;
}

export function errorMessage(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong";
}
