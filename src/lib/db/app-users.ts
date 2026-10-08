import type { UserProfile } from "@/lib/types";
import { ensureDbSchema, getSql, isDbConfigured } from "./client";

export interface DbAppUser {
  id: string;
  nickname: string;
  avatar: string | null;
  referred_by: string | null;
  registered_via: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  first_seen_at: string;
  last_seen_at: string;
}

export async function upsertAppUserFromProfile(user: UserProfile): Promise<void> {
  if (!isDbConfigured()) return;
  await ensureDbSchema();
  const sql = getSql();
  const registeredVia =
    user.registeredVia ??
    (user.phone ? "phone" : user.email ? "email" : "guest");

  await sql`
    INSERT INTO app_users (
      id, nickname, avatar, referred_by, registered_via, phone, email, created_at, last_seen_at
    ) VALUES (
      ${user.id},
      ${user.nickname},
      ${user.avatar},
      ${user.referredBy ?? null},
      ${registeredVia},
      ${user.phone ?? null},
      ${user.email ?? null},
      ${user.createdAt},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      nickname = EXCLUDED.nickname,
      avatar = EXCLUDED.avatar,
      referred_by = COALESCE(EXCLUDED.referred_by, app_users.referred_by),
      registered_via = EXCLUDED.registered_via,
      phone = COALESCE(EXCLUDED.phone, app_users.phone),
      email = COALESCE(EXCLUDED.email, app_users.email),
      last_seen_at = NOW()
  `;
}

export async function listAppUsers(limit = 100): Promise<DbAppUser[]> {
  if (!isDbConfigured()) return [];
  await ensureDbSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM app_users
    ORDER BY last_seen_at DESC
    LIMIT ${limit}
  `;
  return rows as DbAppUser[];
}

export async function countAppUsers(): Promise<number> {
  if (!isDbConfigured()) return 0;
  await ensureDbSchema();
  const sql = getSql();
  const rows = await sql`SELECT COUNT(*)::int AS c FROM app_users`;
  return Number(rows[0]?.c ?? 0);
}

export async function countRegisteredUsers(): Promise<number> {
  if (!isDbConfigured()) return 0;
  await ensureDbSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT COUNT(*)::int AS c FROM app_users
    WHERE registered_via IN ('phone', 'email')
       OR phone IS NOT NULL
       OR email IS NOT NULL
  `;
  return Number(rows[0]?.c ?? 0);
}
