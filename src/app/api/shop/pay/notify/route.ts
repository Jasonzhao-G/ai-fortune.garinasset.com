import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentNotify } from "@/lib/shop/payment-gateway";

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

    // TODO: 幂等更新订单 paid + fulfillVirtualOrder（迁移至 DB 后实现）
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "notify error" }, { status: 500 });
  }
}
