import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/api-auth";
import { listAppUsers } from "@/lib/db/app-users";
import { isDbConfigured } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ users: [], dbConfigured: false });
  }

  const users = await listAppUsers(200);
  return NextResponse.json({ users, dbConfigured: true });
}
