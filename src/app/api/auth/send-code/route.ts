import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { saveOtp, accountExists } from "@/lib/db/auth";
import { generateOtpCode } from "@/lib/auth/otp";
import {
  normalizeAccount,
  validateAccount,
  type OtpPurpose,
} from "@/lib/auth/otp";
import { deliverOtpCode, shouldExposeDemoCode } from "@/lib/auth/delivery";

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "认证服务未配置数据库" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as {
      method?: "phone" | "email";
      account?: string;
      purpose?: OtpPurpose;
    };

    const { method, account, purpose } = body;
    if (!method || !account || !purpose) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }
    if (method !== "phone" && method !== "email") {
      return NextResponse.json({ error: "无效的注册方式" }, { status: 400 });
    }

    const normalized = normalizeAccount(method, account);
    if (!validateAccount(method, normalized)) {
      return NextResponse.json({ error: "账号格式不正确" }, { status: 400 });
    }

    if (purpose === "register" && (await accountExists(method, normalized))) {
      return NextResponse.json({ error: "该账号已注册，请登录" }, { status: 409 });
    }
    if ((purpose === "login" || purpose === "reset") && !(await accountExists(method, normalized))) {
      return NextResponse.json({ error: "账号未注册" }, { status: 404 });
    }

    const code = generateOtpCode();
    await saveOtp(method, normalized, purpose, code);
    const delivery = await deliverOtpCode({ method, account: normalized, code, purpose });

    const payload: Record<string, unknown> = {
      ok: true,
      delivered: delivery.delivered,
      mode: delivery.mode,
      cooldown: 60,
    };
    if (!delivery.delivered && shouldExposeDemoCode()) {
      payload.demoCode = code;
      payload.message = "演示环境：验证码见 demoCode（生产请配置邮件或短信）";
    } else if (!delivery.delivered) {
      payload.message =
        "验证码已生成。请配置 RESEND_API_KEY（邮箱）或 AUTH_SMS_HOOK_URL（短信）以自动发送。";
    }

    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "发送失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
