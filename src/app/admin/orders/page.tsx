"use client";

import { useEffect, useState } from "react";
import type { DbShopOrder } from "@/lib/db/shop-orders";
import { ORDER_STATUS_LABEL } from "@/lib/shop/order-store";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<DbShopOrder[]>([]);

  useEffect(() => {
    void fetch("/api/admin/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  return (
    <>
      <header className="mb-4">
        <h1 className="page-title">商城订单</h1>
        <p className="caption text-app-muted">虚拟商品服务端订单 · 最多 200 条</p>
      </header>

      <div className="space-y-2">
        {orders.length === 0 ? (
          <p className="caption py-8 text-center text-app-muted">暂无订单</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="app-card !py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="block-title text-sm">
                  {o.product_emoji} {o.product_name}
                </p>
                <span className="caption font-semibold text-app-accent">¥{o.amount}</span>
              </div>
              <p className="caption mt-1 font-mono text-[10px] text-app-muted">{o.id}</p>
              <div className="caption mt-2 flex flex-wrap gap-x-3 gap-y-1 text-app-muted">
                <span>用户 {o.user_id}</span>
                <span>{ORDER_STATUS_LABEL[o.status] ?? o.status}</span>
                {o.pay_method && <span>{o.pay_method === "wechat" ? "微信" : "支付宝"}</span>}
                <span>{formatTime(o.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN");
  } catch {
    return iso;
  }
}
