import type { UserProfile } from "@/lib/types";

export type AuthMethod = "phone" | "email";

export async function authSendCode(params: {
  method: AuthMethod;
  account: string;
  purpose: "register" | "login" | "reset";
}): Promise<{ demoCode?: string; message?: string; error?: string }> {
  const res = await fetch("/api/auth/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? "发送失败" };
  return { demoCode: data.demoCode, message: data.message };
}

export async function authRegister(params: {
  method: AuthMethod;
  account: string;
  code: string;
  password: string;
  nickname?: string;
  refCode?: string;
  existingUserId?: string;
}): Promise<{ user?: UserProfile; error?: string }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? "注册失败" };
  return { user: data.user as UserProfile };
}

export async function authLogin(params: {
  method: AuthMethod;
  account: string;
  password?: string;
  code?: string;
}): Promise<{ user?: UserProfile; error?: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? "登录失败" };
  return { user: data.user as UserProfile };
}

export async function authResetPassword(params: {
  method: AuthMethod;
  account: string;
  code: string;
  newPassword: string;
}): Promise<{ error?: string }> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? "重置失败" };
  return {};
}

export async function authLogout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export async function authFetchSession(): Promise<UserProfile | null> {
  const res = await fetch("/api/auth/session", { credentials: "include" });
  const data = await res.json();
  if (!data.loggedIn || !data.user) return null;
  return data.user as UserProfile;
}
