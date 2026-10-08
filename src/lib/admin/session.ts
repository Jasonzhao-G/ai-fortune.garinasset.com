import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "af_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret(): string | null {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim();
  return secret || null;
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  if (password.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(password), Buffer.from(expected));
  } catch {
    return false;
  }
}

function signPayload(payload: string): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdminSessionToken(): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const sig = signPayload(payload);
  if (!sig) return null;
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = signPayload(payload);
  if (!expected) return false;
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      exp?: number;
    };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function getAdminSessionFromCookies(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}
