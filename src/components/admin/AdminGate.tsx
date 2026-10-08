"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminLoginForm from "./AdminLoginForm";
import AdminNav from "./AdminNav";
import { useAdminSession } from "./useAdminSession";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, loggedIn, adminConfigured, login, logout } = useAdminSession();

  useEffect(() => {
    if (!loading && loggedIn && window.location.pathname === "/admin") {
      router.replace("/admin/dashboard");
    }
  }, [loading, loggedIn, router]);

  if (loading) {
    return <p className="caption py-8 text-center text-app-muted">加载中…</p>;
  }

  if (!adminConfigured) {
    return (
      <div className="app-card mx-auto max-w-md text-left">
        <p className="block-title text-center">后台未启用</p>
        <p className="caption mt-2 text-app-muted">
          当前线上尚未设置管理员密码。请在 Vercel 项目{" "}
          <strong>Settings → Environment Variables</strong> 中添加：
        </p>
        <ul className="caption mt-3 list-inside list-disc space-y-2 text-app-muted">
          <li>
            <code className="text-[11px]">ADMIN_PASSWORD</code>（必填，自定强密码，用于登录后台）
          </li>
          <li>
            <code className="text-[11px]">ADMIN_SESSION_SECRET</code>（建议填一串随机字符）
          </li>
          <li>
            <code className="text-[11px]">DATABASE_URL</code>（选填，Neon Postgres 连接串；不配也能登录，但用户/订单统计为 0）
          </li>
        </ul>
        <p className="caption mt-3 text-app-muted">
          环境选 <strong>Production</strong>，保存后打开 Deployments → 最新部署 →{" "}
          <strong>Redeploy</strong>。
        </p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <AdminLoginForm
        onLogin={async (password) => {
          await login(password);
          router.push("/admin/dashboard");
        }}
      />
    );
  }

  return (
    <>
      <AdminNav onLogout={() => void logout()} />
      {children}
    </>
  );
}
