import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentNotify } from "@/lib/shop/payment-gateway";
import { isDbConfigured } from "@/lib/db/client";
import { markDbOrderPaidFromNotify } from "@/lib/db/shop-orders";

/**
 * 聚合支付异步通知入口（生产环境由支付平台 POST 调用）
 * 验签通过后应将订单标记为 paid 并触发虚拟商品发货（需服务端订单库）
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const verified = verifyPaymentNotify(payload);

    if (!verified.ok || !verified.orderId) {
      return NextResponse.json({ error: "invalid notify" }, { status: 400 });
    }

    if (isDbConfigured()) {
      await markDbOrderPaidFromNotify(
        verified.orderId,
        verified.providerTradeNo,
      );
    }
    // TODO: 聚合验签通过后，服务端虚拟发货（灵丹入账需服务端账本）
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "notify error" }, { status: 500 });
  }
}
