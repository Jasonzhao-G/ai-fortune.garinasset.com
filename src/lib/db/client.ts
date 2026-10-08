import { neon, neonConfig } from "@neondatabase/serverless";

neonConfig.fetchConnectionCache = true;

let schemaPromise: Promise<void> | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getSql() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export async function ensureDbSchema() {
  if (!isDbConfigured()) return;
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS app_users (
          id TEXT PRIMARY KEY,
          nickname TEXT NOT NULL,
          avatar TEXT,
          referred_by TEXT,
          registered_via TEXT,
          phone TEXT,
          email TEXT,
          created_at TIMESTAMPTZ NOT NULL,
          first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS shop_orders (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES app_users(id),
          sku TEXT NOT NULL,
          product_name TEXT NOT NULL,
          product_emoji TEXT NOT NULL DEFAULT '',
          amount NUMERIC(10, 2) NOT NULL,
          category TEXT NOT NULL DEFAULT 'virtual',
          status TEXT NOT NULL,
          pay_method TEXT,
          provider_trade_no TEXT,
          paid_at TIMESTAMPTZ,
          fulfilled_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS shop_orders_user_id_idx ON shop_orders(user_id)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS shop_orders_created_at_idx ON shop_orders(created_at DESC)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS auth_accounts (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES app_users(id),
          method TEXT NOT NULL,
          account TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (method, account)
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS auth_otps (
          id SERIAL PRIMARY KEY,
          method TEXT NOT NULL,
          account TEXT NOT NULL,
          purpose TEXT NOT NULL,
          code_hash TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS auth_otps_lookup_idx ON auth_otps (method, account, purpose, created_at DESC)
      `;
    })();
  }
  await schemaPromise;
}
