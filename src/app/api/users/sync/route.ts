import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db/client";
import { upsertAppUserFromProfile } from "@/lib/db/app-users";
import type { UserProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, mode: "no_db" });
  }

  try {
    const body = (await req.json()) as Partial<UserProfile> & { id?: string };
    if (!body.id || !body.nickname || !body.createdAt) {
      return NextResponse.json({ error: "invalid user" }, { status: 400 });
    }

    const user: UserProfile = {
      id: body.id,
      nickname: body.nickname,
      avatar: body.avatar ?? "",
      inviteCode: body.inviteCode ?? body.id,
      referredBy: body.referredBy,
      createdAt: body.createdAt,
      subscription: body.subscription ?? null,
      subscriptionExpiry: body.subscriptionExpiry,
      trialExpiry: body.trialExpiry,
      phone: body.phone,
      email: body.email,
      registeredVia: body.registeredVia,
    };

    await upsertAppUserFromProfile(user);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
