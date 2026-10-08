import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminPassword,
} from "@/lib/admin/session";

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "未配置 ADMIN_PASSWORD" },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json()) as { password?: string };
    if (!body.password || !verifyAdminPassword(body.password)) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    const token = createAdminSessionToken();
    if (!token) {
      return NextResponse.json({ error: "无法创建会话" }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
