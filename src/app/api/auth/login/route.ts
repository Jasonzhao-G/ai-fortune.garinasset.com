import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { verifyAccountPassword, verifyOtp, getAuthByAccount } from "@/lib/db/auth";
import { normalizeAccount, validateAccount } from "@/lib/auth/otp";
import { attachUserSession } from "@/lib/auth/cookies";
import { isUserSessionConfigured } from "@/lib/auth/session";
import { getSql, ensureDbSchema } from "@/lib/db/client";

async function loadUserByAuth(method: "phone" | "email", account: string) {
  const auth = await getAuthByAccount(method, account);
  if (!auth) return null;
  await ensureDbSchema();
  const sql = getSql();
  const rows = await sql`SELECT * FROM app_users WHERE id = ${auth.user_id} LIMIT 1`;
  const row = rows[0] as {
    id: string;
    nickname: string;
    avatar: string | null;
    referred_by: string | null;
    phone: string | null;
    email: string | null;
    created_at: string;
    registered_via: string | null;
  };
  if (!row) return null;
  return {
    id: row.id,
    nickname: row.nickname,
    avatar: row.avatar ?? "",
    inviteCode: row.id,
    referredBy: row.referred_by ?? undefined,
    createdAt: row.created_at,
    subscription: null,
    registeredVia: method,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
  };
}

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
      password?: string;
      code?: string;
    };

    const { method, account, password, code } = body;
    if (!method || !account) {
      return NextResponse.json({ error: "请输入账号" }, { status: 400 });
    }

    const normalized = normalizeAccount(method, account);
    if (!validateAccount(method, normalized)) {
      return NextResponse.json({ error: "账号格式不正确" }, { status: 400 });
    }

    let user = null;

    if (code?.trim()) {
      const otpOk = await verifyOtp(method, normalized, "login", code.trim());
      if (!otpOk) return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });
      user = await loadUserByAuth(method, normalized);
    } else if (password) {
      user = await verifyAccountPassword(method, normalized, password);
    } else {
      return NextResponse.json({ error: "请输入密码或验证码" }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
    }

    const res = NextResponse.json({ user });
    return attachUserSession(res, user.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "登录失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
