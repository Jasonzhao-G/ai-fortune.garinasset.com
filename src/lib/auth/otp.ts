import { createHash, randomInt } from "crypto";
import bcrypt from "bcryptjs";

export type OtpPurpose = "register" | "login" | "reset";

export function normalizeAccount(method: "phone" | "email", account: string): string {
  const trimmed = account.trim().toLowerCase();
  return method === "phone" ? trimmed.replace(/\s/g, "") : trimmed;
}

export function validateAccount(method: "phone" | "email", account: string): boolean {
  if (method === "phone") return /^1\d{10}$/.test(account);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account);
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "密码至少 8 位";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "密码需同时包含字母与数字";
  }
  return null;
}
