import { getSql, ensureDbSchema, isDbConfigured } from "./client";
import {
  hashOtp,
  hashPassword,
  normalizeAccount,
  type OtpPurpose,
  verifyPassword,
} from "@/lib/auth/otp";
import { upsertAppUserFromProfile } from "./app-users";
import type { UserProfile } from "@/lib/types";
import { AVATAR_SEEDS } from "@/lib/auth/user-factory";

export async function saveOtp(
  method: "phone" | "email",
  account: string,
  purpose: OtpPurpose,
  code: string,
): Promise<void> {
  if (!isDbConfigured()) throw new Error("DATABASE_URL 未配置");
  await ensureDbSchema();
  const sql = getSql();
  const normalized = normalizeAccount(method, account);
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO auth_otps (method, account, purpose, code_hash, expires_at)
    VALUES (${method}, ${normalized}, ${purpose}, ${hashOtp(code)}, ${expires})
  `;
}

export async function verifyOtp(
  method: "phone" | "email",
  account: string,
  purpose: OtpPurpose,
  code: string,
): Promise<boolean> {
  if (!isDbConfigured()) return false;
  await ensureDbSchema();
  const sql = getSql();
  const normalized = normalizeAccount(method, account);
  const rows = await sql`
    SELECT id, code_hash, expires_at FROM auth_otps
    WHERE method = ${method} AND account = ${normalized} AND purpose = ${purpose}
    ORDER BY created_at DESC
    LIMIT 5
  `;
  const target = hashOtp(code);
  for (const row of rows as { id: number; code_hash: string; expires_at: string }[]) {
    if (row.code_hash !== target) continue;
    if (new Date(row.expires_at) < new Date()) continue;
    await sql`DELETE FROM auth_otps WHERE id = ${row.id}`;
    return true;
  }
  return false;
}

export async function accountExists(method: "phone" | "email", account: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  await ensureDbSchema();
  const sql = getSql();
  const normalized = normalizeAccount(method, account);
  const rows = await sql`
    SELECT 1 FROM auth_accounts WHERE method = ${method} AND account = ${normalized} LIMIT 1
  `;
  return rows.length > 0;
}

export async function getAuthByAccount(
  method: "phone" | "email",
  account: string,
): Promise<{ user_id: string; password_hash: string } | null> {
  if (!isDbConfigured()) return null;
  await ensureDbSchema();
  const sql = getSql();
  const normalized = normalizeAccount(method, account);
  const rows = await sql`
    SELECT user_id, password_hash FROM auth_accounts
    WHERE method = ${method} AND account = ${normalized}
    LIMIT 1
  `;
  return (rows[0] as { user_id: string; password_hash: string } | undefined) ?? null;
}

function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=c45c48,d4a574,5a8a7a`;
}

function randomId(): string {
  return `LF${Math.floor(10000000 + Math.random() * 90000000)}`;
}

export async function registerAuthAccount(params: {
  method: "phone" | "email";
  account: string;
  password: string;
  nickname?: string;
  referredBy?: string;
  existingUserId?: string;
}): Promise<UserProfile> {
  if (!isDbConfigured()) throw new Error("DATABASE_URL 未配置");
  await ensureDbSchema();
  const sql = getSql();
  const normalized = normalizeAccount(params.method, params.account);

  const exists = await accountExists(params.method, normalized);
  if (exists) throw new Error("该账号已注册，请直接登录");

  const userId = params.existingUserId ?? randomId();
  const seed = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)] + userId;
  const user: UserProfile = {
    id: userId,
    avatar: avatarUrl(seed),
    nickname: params.nickname?.trim() || `命理者${userId.slice(-4)}`,
    inviteCode: userId,
    referredBy: params.referredBy,
    createdAt: new Date().toISOString(),
    subscription: null,
    registeredVia: params.method,
    phone: params.method === "phone" ? normalized : undefined,
    email: params.method === "email" ? normalized : undefined,
  };

  await upsertAppUserFromProfile(user);
  const passwordHash = await hashPassword(params.password);
  await sql`
    INSERT INTO auth_accounts (user_id, method, account, password_hash)
    VALUES (${userId}, ${params.method}, ${normalized}, ${passwordHash})
  `;

  return user;
}

export async function updatePassword(
  method: "phone" | "email",
  account: string,
  newPassword: string,
): Promise<void> {
  if (!isDbConfigured()) throw new Error("DATABASE_URL 未配置");
  await ensureDbSchema();
  const sql = getSql();
  const normalized = normalizeAccount(method, account);
  const passwordHash = await hashPassword(newPassword);
  const rows = await sql`
    UPDATE auth_accounts SET password_hash = ${passwordHash}, updated_at = NOW()
    WHERE method = ${method} AND account = ${normalized}
    RETURNING user_id
  `;
  if (rows.length === 0) throw new Error("账号不存在");
}

export async function verifyAccountPassword(
  method: "phone" | "email",
  account: string,
  password: string,
): Promise<UserProfile | null> {
  const auth = await getAuthByAccount(method, account);
  if (!auth) return null;
  const ok = await verifyPassword(password, auth.password_hash);
  if (!ok) return null;

  await ensureDbSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM app_users WHERE id = ${auth.user_id} LIMIT 1
  `;
  const row = rows[0] as {
    id: string;
    nickname: string;
    avatar: string | null;
    referred_by: string | null;
    registered_via: string | null;
    phone: string | null;
    email: string | null;
    created_at: string;
  } | undefined;
  if (!row) return null;

  return {
    id: row.id,
    nickname: row.nickname,
    avatar: row.avatar ?? avatarUrl(row.id),
    inviteCode: row.id,
    referredBy: row.referred_by ?? undefined,
    createdAt: row.created_at,
    subscription: null,
    registeredVia: (row.registered_via as UserProfile["registeredVia"]) ?? method,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
  };
}

