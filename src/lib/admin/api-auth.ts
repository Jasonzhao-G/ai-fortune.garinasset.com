import { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminSessionToken } from "./session";

export function isAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}
