import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin/api-auth";
import { listDbShopOrders } from "@/lib/db/shop-orders";
import { isDbConfigured } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ orders: [], dbConfigured: false });
  }

  const orders = await listDbShopOrders(200);
  return NextResponse.json({ orders, dbConfigured: true });
}
