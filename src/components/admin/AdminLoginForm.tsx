"use client";

import { useState } from "react";

export default function AdminLoginForm({ onLogin }: { onLogin: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onLogin(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="app-card mx-auto max-w-sm">
      <p className="block-title mb-1">运营后台</p>
      <p className="caption mb-4 text-app-muted">请输入管理员密码</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm"
        placeholder="ADMIN_PASSWORD"
        autoComplete="current-password"
      />
      {error && <p className="caption mt-2 text-red-500">{error}</p>}
      <button type="submit" disabled={submitting || !password} className="app-btn mt-4 w-full disabled:opacity-50">
        {submitting ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
