import { NextResponse } from "next/server";
import { getAdminSessionFromCookies, isAdminConfigured } from "@/lib/admin/session";
import { isDbConfigured } from "@/lib/db/client";

export async function GET() {
  const loggedIn = await getAdminSessionFromCookies();
  return NextResponse.json({
    loggedIn,
    adminConfigured: isAdminConfigured(),
    dbConfigured: isDbConfigured(),
  });
}
