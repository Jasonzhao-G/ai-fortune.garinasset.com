import { NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth/cookies";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  return clearUserSession(res);
}
