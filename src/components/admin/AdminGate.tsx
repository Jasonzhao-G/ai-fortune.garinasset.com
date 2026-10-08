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
      <div className="app-card mx-auto max-w-md text-center">
        <p className="block-title">后台未启用</p>
        <p className="caption mt-2 text-app-muted">
          请在 Vercel 配置 <code className="text-[11px]">ADMIN_PASSWORD</code> 与{" "}
          <code className="text-[11px]">DATABASE_URL</code> 后重新部署。
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
