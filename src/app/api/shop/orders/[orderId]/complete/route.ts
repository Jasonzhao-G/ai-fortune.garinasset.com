import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { markDbOrderPaid } from "@/lib/db/shop-orders";
import type { PayMethod } from "@/lib/shop/order-store";

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } },
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, mode: "no_db" });
  }

  try {
    const body = (await req.json()) as { userId?: string; payMethod?: PayMethod };
    const { userId, payMethod } = body;
    if (!userId || !payMethod || (payMethod !== "alipay" && payMethod !== "wechat")) {
      return NextResponse.json({ error: "参数无效" }, { status: 400 });
    }

    const order = await markDbOrderPaid(params.orderId, userId, payMethod, {
      markFulfilled: true,
    });
    if (!order) {
      return NextResponse.json({ error: "订单不存在或无法完成" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (e) {
    const message = e instanceof Error ? e.message : "更新订单失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
