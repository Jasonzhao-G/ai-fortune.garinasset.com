import type { PayMethod } from "./order-store";
import { getShopPaymentQrUrl } from "./payment";

export type PayScene = "h5" | "native";

export interface CreateShopPaymentInput {
  orderId: string;
  sku: string;
  amount: number;
  userId: string;
  method: PayMethod;
  scene: PayScene;
}

export type CreateShopPaymentResult =
  | {
      mode: "demo";
      qrCodeUrl: string;
      payUrl?: string;
      message: string;
    }
  | {
      mode: "live";
      qrCodeUrl?: string;
      payUrl: string;
      providerTradeNo: string;
    };

/** 聚合商户进件完成后配置 PAY_AGGREGATOR_* */
export function isPaymentAggregatorConfigured(): boolean {
  return Boolean(
    process.env.PAY_AGGREGATOR_MERCHANT_ID?.trim() &&
      process.env.PAY_AGGREGATOR_SECRET?.trim(),
  );
}

export async function createShopPayment(
  input: CreateShopPaymentInput,
): Promise<CreateShopPaymentResult> {
  if (!isPaymentAggregatorConfigured()) {
    return {
      mode: "demo",
      qrCodeUrl: getShopPaymentQrUrl(
        input.orderId,
        input.amount,
        input.method,
        input.userId,
      ),
      message:
        "当前为演示支付。接入聚合支付后，此处将展示微信/支付宝真实收款码或 H5 收银台。",
    };
  }

  // TODO: 对接聚合支付统一下单（微信 Native/H5 + 支付宝）
  throw new Error("聚合支付 SDK 尚未接入，请先在 Vercel 配置密钥并完成 createShopPayment 实现");
}

/** 聚合异步通知验签与查单（notify 路由调用） */
export function verifyPaymentNotify(_payload: unknown): {
  ok: boolean;
  orderId?: string;
  providerTradeNo?: string;
} {
  return { ok: false };
}
