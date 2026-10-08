import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const USER_SESSION_COOKIE = "af_user_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret(): string | null {
  return (
    process.env.USER_SESSION_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    null
  );
}

function sign(payload: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createUserSessionToken(userId: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ userId, exp })).toString("base64url");
  const sig = sign(payload);
  if (!sig) return null;
  return `${payload}.${sig}`;
}

export function verifyUserSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (!expected) return null;
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      userId?: string;
      exp?: number;
    };
    if (typeof data.exp !== "number" || data.exp <= Date.now()) return null;
    return data.userId ?? null;
  } catch {
    return null;
  }
}

export async function getUserIdFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return verifyUserSessionToken(jar.get(USER_SESSION_COOKIE)?.value);
}

export function isUserSessionConfigured(): boolean {
  return Boolean(getSecret());
}
