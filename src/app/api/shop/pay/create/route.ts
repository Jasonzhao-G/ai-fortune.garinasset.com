import { NextRequest, NextResponse } from "next/server";
import { getProductBySku } from "@/lib/shop/catalog";
import { canCheckoutInApp } from "@/lib/shop/purchase";
import { createShopPayment, type PayScene } from "@/lib/shop/payment-gateway";
import type { PayMethod } from "@/lib/shop/order-store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      orderId?: string;
      sku?: string;
      amount?: number;
      userId?: string;
      method?: PayMethod;
      scene?: PayScene;
    };

    const { orderId, sku, amount, userId, method } = body;
    const scene: PayScene = body.scene === "h5" ? "h5" : "native";

    if (!orderId || !sku || !userId || !method) {
      return NextResponse.json({ error: "缺少订单参数" }, { status: 400 });
    }
    if (method !== "alipay" && method !== "wechat") {
      return NextResponse.json({ error: "无效的支付方式" }, { status: 400 });
    }

    const product = getProductBySku(sku);
    if (!product || !canCheckoutInApp(product)) {
      return NextResponse.json({ error: "该商品不支持站内支付" }, { status: 400 });
    }

    if (typeof amount !== "number" || amount !== product.price) {
      return NextResponse.json({ error: "订单金额与商品价格不一致" }, { status: 400 });
    }

    const result = await createShopPayment({
      orderId,
      sku,
      amount,
      userId,
      method,
      scene,
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "创建支付失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
