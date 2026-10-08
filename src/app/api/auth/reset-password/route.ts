import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { updatePassword, verifyOtp } from "@/lib/db/auth";
import { normalizeAccount, validateAccount, validatePassword } from "@/lib/auth/otp";

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "认证服务未配置数据库" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as {
      method?: "phone" | "email";
      account?: string;
      code?: string;
      newPassword?: string;
    };

    const { method, account, code, newPassword } = body;
    if (!method || !account || !code || !newPassword) {
      return NextResponse.json({ error: "请填写完整信息" }, { status: 400 });
    }

    const normalized = normalizeAccount(method, account);
    if (!validateAccount(method, normalized)) {
      return NextResponse.json({ error: "账号格式不正确" }, { status: 400 });
    }
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) return NextResponse.json({ error: pwdErr }, { status: 400 });

    const otpOk = await verifyOtp(method, normalized, "reset", code);
    if (!otpOk) return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });

    await updatePassword(method, normalized, newPassword);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "重置失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
