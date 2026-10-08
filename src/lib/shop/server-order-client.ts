import type { ShopOrder } from "./order-store";
import type { UserProfile } from "@/lib/types";

export async function createServerShopOrder(
  sku: string,
  user: UserProfile,
): Promise<ShopOrder | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/shop/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, userId: user.id, user }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { order?: ShopOrder };
    return data.order ?? null;
  } catch {
    return null;
  }
}

export async function completeServerShopOrder(
  orderId: string,
  userId: string,
  payMethod: "alipay" | "wechat",
): Promise<boolean> {
  try {
    const res = await fetch(`/api/shop/orders/${orderId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, payMethod }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
