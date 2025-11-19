import { ProductCard } from "@/app/(public)/products/page";

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function getDiscountPercent(p: ProductCard) {
  const oldPricd = Number(p.oldPrice);
  const price = Number(p.price);
  if (isNaN(oldPricd) || isNaN(price) || oldPricd <= price) return null;
  if (!oldPricd || oldPricd <= price) return null;
  const pct = Math.round(((oldPricd - price) / oldPricd) * 100);
  return pct > 0 ? pct : null;
}

export const fmtVND = (n?: string | number | null) => {
  if (!n) return '0đ';

  const num =  typeof(n) === "string" ? Number(n) : n;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'đ';
}