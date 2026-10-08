import { getOrCreateUser } from "@/lib/user-store";
import { purchasePetFood } from "@/lib/pet-food-store";
import { getProductBySku, type ShopCategory } from "./catalog";
import { canCheckoutInApp } from "./purchase";
import { grantVirtualItem } from "./inventory-store";

export type OrderStatus = "pending_payment" | "paid" | "fulfilled" | "cancelled";
export type PayMethod = "alipay" | "wechat";

export interface ShopOrderItem {
  sku: string;
  name: string;
  price: number;
  qty: number;
  emoji: string;
}

export interface ShopOrder {
  id: string;
  userId: string;
  items: ShopOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  category: ShopCategory;
  payMethod?: PayMethod;
  paidAt?: string;
  fulfilledAt?: string;
  createdAt: string;
}

const KEY = "ai-fortune-shop-orders";

function getAllOrders(): ShopOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: ShopOrder[]) {
  localStorage.setItem(KEY, JSON.stringify(orders));
}

function genOrderId(): string {
  return `SO${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function createOrder(sku: string, userId?: string): ShopOrder | null {
  const product = getProductBySku(sku);
  const uid = userId ?? getOrCreateUser().id;
  if (!product || !canCheckoutInApp(product)) return null;

  const order: ShopOrder = {
    id: genOrderId(),
    userId: uid,
    items: [{
      sku: product.sku,
      name: product.name,
      price: product.price,
      qty: 1,
      emoji: product.emoji,
    }],
    totalAmount: product.price,
    status: "pending_payment",
    category: product.section,
    createdAt: new Date().toISOString(),
  };

  saveOrders([order, ...getAllOrders()]);
  return order;
}

export function getOrderById(orderId: string): ShopOrder | undefined {
  return getAllOrders().find((o) => o.id === orderId);
}

export function getOrdersForUser(userId?: string): ShopOrder[] {
  const uid = userId ?? getOrCreateUser().id;
  return getAllOrders()
    .filter((o) => o.userId === uid)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateOrder(
  orderId: string,
  patch: Partial<Pick<ShopOrder, "status" | "payMethod" | "paidAt" | "fulfilledAt">>,
): ShopOrder | null {
  const orders = getAllOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return null;
  orders[idx] = { ...orders[idx], ...patch };
  saveOrders(orders);
  return orders[idx];
}

function fulfillVirtualOrder(order: ShopOrder): ShopOrder {
  for (const item of order.items) {
    const product = getProductBySku(item.sku);
    if (!product || product.section !== "virtual") continue;

    if (product.virtualKind === "food" && product.foodPlanId) {
      purchasePetFood(product.foodPlanId, order.userId);
    } else if (product.virtualKind && product.virtualKind !== "food") {
      grantVirtualItem(order.userId, {
        sku: product.sku,
        name: product.name,
        kind: product.virtualKind,
        emoji: product.emoji,
      });
    }
  }

  return updateOrder(order.id, {
    status: "fulfilled",
    fulfilledAt: new Date().toISOString(),
  })!;
}

export function confirmOrderPaid(
  orderId: string,
  payMethod: PayMethod,
): ShopOrder | null {
  const order = getOrderById(orderId);
  if (!order || order.status !== "pending_payment") return null;

  const paid = updateOrder(orderId, {
    status: "paid",
    payMethod,
    paidAt: new Date().toISOString(),
  });
  if (!paid) return null;

  if (paid.category === "virtual") {
    return fulfillVirtualOrder(paid);
  }
  return paid;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "待付款",
  paid: "已付款",
  fulfilled: "已完成",
  cancelled: "已取消",
};

export const PAY_METHOD_LABEL: Record<PayMethod, string> = {
  alipay: "支付宝",
  wechat: "微信支付",
};
