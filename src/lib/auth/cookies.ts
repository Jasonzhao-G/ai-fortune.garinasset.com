import { NextResponse } from "next/server";
import { USER_SESSION_COOKIE, createUserSessionToken } from "./session";

export function attachUserSession(res: NextResponse, userId: string): NextResponse {
  const token = createUserSessionToken(userId);
  if (token) {
    res.cookies.set(USER_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
  }
  return res;
}

export function clearUserSession(res: NextResponse): NextResponse {
  res.cookies.set(USER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
