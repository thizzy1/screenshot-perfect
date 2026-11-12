import { cn } from "@/lib/utils";
import { ORDER_STATUS } from "@/lib/format";

const tones = {
  muted: "bg-muted text-muted-foreground",
  warning: "bg-warning/20 text-foreground",
  success: "bg-success/15 text-success",
  brand: "bg-brand/10 text-brand",
  info: "bg-hero-2/10 text-hero-2",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const s = ORDER_STATUS[status];
  const tone = s?.tone ?? (status === "verified" || status === "active" ? "success" : status === "pending" ? "warning" : status === "suspended" || status === "banned" ? "brand" : "muted");
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", tones[tone])}>
      {label ?? s?.label ?? status}
    </span>
  );
}
