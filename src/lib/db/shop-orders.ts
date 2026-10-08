import type { OrderStatus, PayMethod, ShopOrder } from "@/lib/shop/order-store";
import type { ShopProduct } from "@/lib/shop/catalog";
import { ensureDbSchema, getSql, isDbConfigured } from "./client";
import { upsertAppUserFromProfile } from "./app-users";
import type { UserProfile } from "@/lib/types";

export interface DbShopOrder {
  id: string;
  user_id: string;
  sku: string;
  product_name: string;
  product_emoji: string;
  amount: string;
  category: string;
  status: OrderStatus;
  pay_method: PayMethod | null;
  provider_trade_no: string | null;
  paid_at: string | null;
  fulfilled_at: string | null;
  created_at: string;
}

function genOrderId(): string {
  return `SO${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function rowToShopOrder(row: DbShopOrder): ShopOrder {
  const amount = Number(row.amount);
  return {
    id: row.id,
    userId: row.user_id,
    items: [
      {
        sku: row.sku,
        name: row.product_name,
        price: amount,
        qty: 1,
        emoji: row.product_emoji,
      },
    ],
    totalAmount: amount,
    status: row.status,
    category: row.category as ShopOrder["category"],
    payMethod: row.pay_method ?? undefined,
    paidAt: row.paid_at ?? undefined,
    fulfilledAt: row.fulfilled_at ?? undefined,
    createdAt: row.created_at,
  };
}

export async function createDbShopOrder(
  product: ShopProduct,
  user: UserProfile,
): Promise<ShopOrder | null> {
  if (!isDbConfigured()) return null;
  await ensureDbSchema();
  await upsertAppUserFromProfile(user);

  const id = genOrderId();
  const sql = getSql();
  await sql`
    INSERT INTO shop_orders (
      id, user_id, sku, product_name, product_emoji, amount, category, status, created_at
    ) VALUES (
      ${id},
      ${user.id},
      ${product.sku},
      ${product.name},
      ${product.emoji},
      ${product.price},
      ${product.section},
      'pending_payment',
      NOW()
    )
  `;

  const row = await getDbOrderById(id);
  return row ? rowToShopOrder(row) : null;
}

export async function getDbOrderById(orderId: string): Promise<DbShopOrder | null> {
  if (!isDbConfigured()) return null;
  await ensureDbSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM shop_orders WHERE id = ${orderId} LIMIT 1
  `;
  return (rows[0] as DbShopOrder | undefined) ?? null;
}

export async function getDbShopOrderForClient(orderId: string): Promise<ShopOrder | null> {
  const row = await getDbOrderById(orderId);
  return row ? rowToShopOrder(row) : null;
}

export async function markDbOrderPaid(
  orderId: string,
  userId: string,
  payMethod: PayMethod,
  opts?: { providerTradeNo?: string; markFulfilled?: boolean },
): Promise<ShopOrder | null> {
  if (!isDbConfigured()) return null;
  await ensureDbSchema();
  const sql = getSql();
  const existing = await getDbOrderById(orderId);
  if (!existing || existing.user_id !== userId) return null;
  if (existing.status !== "pending_payment") {
    return rowToShopOrder(existing);
  }

  const fulfilled = opts?.markFulfilled ?? existing.category === "virtual";
  const newStatus: OrderStatus = fulfilled ? "fulfilled" : "paid";

  const fulfilledAt = fulfilled ? new Date().toISOString() : null;
  await sql`
    UPDATE shop_orders SET
      status = ${newStatus},
      pay_method = ${payMethod},
      provider_trade_no = ${opts?.providerTradeNo ?? null},
      paid_at = NOW(),
      fulfilled_at = ${fulfilledAt}
    WHERE id = ${orderId}
  `;

  const updated = await getDbOrderById(orderId);
  return updated ? rowToShopOrder(updated) : null;
}

export async function markDbOrderPaidFromNotify(
  orderId: string,
  providerTradeNo?: string,
): Promise<boolean> {
  if (!isDbConfigured()) return false;
  await ensureDbSchema();
  const sql = getSql();
  const existing = await getDbOrderById(orderId);
  if (!existing || existing.status !== "pending_payment") return false;

  const fulfilled = existing.category === "virtual";
  const newStatus: OrderStatus = fulfilled ? "fulfilled" : "paid";

  const fulfilledAt = fulfilled ? new Date().toISOString() : null;
  await sql`
    UPDATE shop_orders SET
      status = ${newStatus},
      provider_trade_no = ${providerTradeNo ?? null},
      paid_at = NOW(),
      fulfilled_at = ${fulfilledAt}
    WHERE id = ${orderId}
  `;
  return true;
}

export async function listDbShopOrders(limit = 100): Promise<DbShopOrder[]> {
  if (!isDbConfigured()) return [];
  await ensureDbSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM shop_orders
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows as DbShopOrder[];
}

export async function getOrderStats(): Promise<{
  paidOrderCount: number;
  payingUserCount: number;
  totalRevenue: number;
}> {
  if (!isDbConfigured()) {
    return { paidOrderCount: 0, payingUserCount: 0, totalRevenue: 0 };
  }
  await ensureDbSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT
      COUNT(*)::int AS paid_order_count,
      COUNT(DISTINCT user_id)::int AS paying_user_count,
      COALESCE(SUM(amount), 0)::float AS total_revenue
    FROM shop_orders
    WHERE status IN ('paid', 'fulfilled')
  `;
  const row = rows[0] as {
    paid_order_count: number;
    paying_user_count: number;
    total_revenue: number;
  };
  return {
    paidOrderCount: Number(row?.paid_order_count ?? 0),
    payingUserCount: Number(row?.paying_user_count ?? 0),
    totalRevenue: Number(row?.total_revenue ?? 0),
  };
}
