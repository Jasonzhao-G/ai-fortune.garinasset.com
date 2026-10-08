import { NextResponse } from "next/server";
import { getUserIdFromCookies } from "@/lib/auth/session";
import { isDbConfigured, getSql, ensureDbSchema } from "@/lib/db/client";

export async function GET() {
  const userId = await getUserIdFromCookies();
  if (!userId || !isDbConfigured()) {
    return NextResponse.json({ loggedIn: false, user: null });
  }

  await ensureDbSchema();
  const sql = getSql();
  const rows = await sql`SELECT * FROM app_users WHERE id = ${userId} LIMIT 1`;
  const row = rows[0] as {
    id: string;
    nickname: string;
    avatar: string | null;
    referred_by: string | null;
    phone: string | null;
    email: string | null;
    created_at: string;
    registered_via: string | null;
  } | undefined;

  if (!row) {
    return NextResponse.json({ loggedIn: false, user: null });
  }

  return NextResponse.json({
    loggedIn: true,
    user: {
      id: row.id,
      nickname: row.nickname,
      avatar: row.avatar ?? "",
      inviteCode: row.id,
      referredBy: row.referred_by ?? undefined,
      createdAt: row.created_at,
      subscription: null,
      registeredVia: row.registered_via ?? undefined,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
    },
  });
}
