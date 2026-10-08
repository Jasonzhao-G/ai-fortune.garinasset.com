import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { registerAuthAccount, verifyOtp } from "@/lib/db/auth";
import { normalizeAccount, validateAccount, validatePassword } from "@/lib/auth/otp";
import { attachUserSession } from "@/lib/auth/cookies";
import { isUserSessionConfigured } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "认证服务未配置数据库" }, { status: 503 });
  }
  if (!isUserSessionConfigured()) {
    return NextResponse.json({ error: "未配置 USER_SESSION_SECRET" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as {
      method?: "phone" | "email";
      account?: string;
      code?: string;
      password?: string;
      nickname?: string;
      refCode?: string;
      existingUserId?: string;
    };

    const { method, account, code, password, nickname, refCode, existingUserId } = body;
    if (!method || !account || !code || !password) {
      return NextResponse.json({ error: "请填写完整注册信息" }, { status: 400 });
    }

    const normalized = normalizeAccount(method, account);
    if (!validateAccount(method, normalized)) {
      return NextResponse.json({ error: "账号格式不正确" }, { status: 400 });
    }
    const pwdErr = validatePassword(password);
    if (pwdErr) return NextResponse.json({ error: pwdErr }, { status: 400 });

    const otpOk = await verifyOtp(method, normalized, "register", code);
    if (!otpOk) return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });

    const user = await registerAuthAccount({
      method,
      account: normalized,
      password,
      nickname,
      referredBy: refCode && refCode !== existingUserId ? refCode : undefined,
      existingUserId:
        existingUserId && existingUserId.startsWith("LF") ? existingUserId : undefined,
    });

    const res = NextResponse.json({ user });
    return attachUserSession(res, user.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "注册失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
