import { authFetchSession } from "@/lib/client/auth-api";
import { applyServerUser, hasRegisteredAccount } from "@/lib/user-store";

export const LOGIN_REQUIRED_EVENT = "ai-fortune-login-required";

export function promptLoginRequired(message?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(LOGIN_REQUIRED_EVENT, { detail: { message } }),
  );
}

/** 已注册或已登录会话则通过；否则弹出登录提示 */
export async function ensureRegisteredAccount(message?: string): Promise<boolean> {
  if (hasRegisteredAccount()) return true;
  try {
    const user = await authFetchSession();
    if (user) {
      applyServerUser(user);
      return true;
    }
  } catch {
    /* ignore */
  }
  promptLoginRequired(message);
  return false;
}
