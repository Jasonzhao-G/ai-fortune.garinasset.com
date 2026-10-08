import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/api-auth";
import { countAppUsers, countRegisteredUsers } from "@/lib/db/app-users";
import { getOrderStats } from "@/lib/db/shop-orders";
import { isDbConfigured } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({
      dbConfigured: false,
      totalUsers: 0,
      registeredUsers: 0,
      payingUsers: 0,
      paidOrders: 0,
      totalRevenue: 0,
    });
  }

  const [totalUsers, registeredUsers, orderStats] = await Promise.all([
    countAppUsers(),
    countRegisteredUsers(),
    getOrderStats(),
  ]);

  return NextResponse.json({
    dbConfigured: true,
    totalUsers,
    registeredUsers,
    payingUsers: orderStats.payingUserCount,
    paidOrders: orderStats.paidOrderCount,
    totalRevenue: orderStats.totalRevenue,
  });
}
