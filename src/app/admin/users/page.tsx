"use client";

import { useEffect, useState } from "react";
import type { DbAppUser } from "@/lib/db/app-users";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DbAppUser[]>([]);
  const [dbConfigured, setDbConfigured] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/users", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setDbConfigured(data.dbConfigured !== false);
      })
      .catch(() => setUsers([]));
  }, []);

  return (
    <>
      <header className="mb-4">
        <h1 className="page-title">用户列表</h1>
        <p className="caption text-app-muted">按最近活跃排序 · 最多 200 条</p>
      </header>

      {!dbConfigured && (
        <p className="caption mb-3 text-app-muted">请先配置 DATABASE_URL</p>
      )}

      <div className="space-y-2">
        {users.length === 0 ? (
          <p className="caption py-8 text-center text-app-muted">暂无数据</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="app-card flex flex-wrap items-start justify-between gap-2 !py-2">
              <div className="min-w-0">
                <p className="block-title text-sm">{u.nickname}</p>
                <p className="caption font-mono text-[10px]">{u.id}</p>
                <p className="caption mt-1 text-app-muted">
                  {u.registered_via === "phone" || u.phone
                    ? "手机注册"
                    : u.registered_via === "email" || u.email
                      ? "邮箱注册"
                      : "访客"}
                  {u.referred_by ? ` · 邀请人 ${u.referred_by}` : ""}
                </p>
              </div>
              <div className="caption shrink-0 text-right text-app-muted">
                <p>首次 {formatTime(u.first_seen_at)}</p>
                <p>最近 {formatTime(u.last_seen_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
