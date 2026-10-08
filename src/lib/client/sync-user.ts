import type { UserProfile } from "@/lib/types";

/** 将本地用户同步到服务端（需配置 DATABASE_URL） */
export function syncUserToServer(user: UserProfile): void {
  if (typeof window === "undefined") return;
  void fetch("/api/users/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      referredBy: user.referredBy,
      registeredVia: user.registeredVia,
      phone: user.phone,
      email: user.email,
      createdAt: user.createdAt,
    }),
  }).catch(() => {
    /* 离线或未配置数据库时忽略 */
  });
}
