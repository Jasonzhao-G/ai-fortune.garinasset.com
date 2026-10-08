import { NextRequest, NextResponse } from "next/server";
import { getProductBySku } from "@/lib/shop/catalog";
import { canCheckoutInApp } from "@/lib/shop/purchase";
import { isDbConfigured } from "@/lib/db/client";
import { createDbShopOrder } from "@/lib/db/shop-orders";
import type { UserProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "订单服务未配置" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as {
      sku?: string;
      userId?: string;
      user?: UserProfile;
    };

    const { sku, userId, user } = body;
    if (!sku || !userId || !user?.id || user.id !== userId) {
      return NextResponse.json({ error: "缺少用户或商品" }, { status: 400 });
    }

    const product = getProductBySku(sku);
    if (!product || !canCheckoutInApp(product)) {
      return NextResponse.json({ error: "该商品不支持站内支付" }, { status: 400 });
    }

    const order = await createDbShopOrder(product, user);
    if (!order) {
      return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
    }

    return NextResponse.json({ order });
  } catch (e) {
    const message = e instanceof Error ? e.message : "创建订单失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
