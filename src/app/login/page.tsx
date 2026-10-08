"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import SecurityCaptcha from "@/components/SecurityCaptcha";
import { authLogin, authSendCode, type AuthMethod } from "@/lib/client/auth-api";
import { applyServerUser } from "@/lib/user-store";
import { useApp } from "@/context/AppContext";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useApp();
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [useOtp, setUseOtp] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [captchaOk, setCaptchaOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((v) => (v > 1 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendCode = async () => {
    if (cooldown > 0) return;
    setError(null);
    setHint(null);
    const result = await authSendCode({ method, account, purpose: "login" });
    if (result.error) {
      setError(result.error);
      return;
    }
    setCodeSent(true);
    setCooldown(60);
    if (result.demoCode) setHint(`演示验证码：${result.demoCode}`);
    else if (result.message) setHint(result.message);
  };

  const handleLogin = async () => {
    setError(null);
    if (!captchaOk) {
      setError("请完成安全验证");
      return;
    }
    setLoading(true);
    const result = await authLogin({
      method,
      account,
      password: useOtp ? undefined : password,
      code: useOtp ? code : undefined,
    });
    setLoading(false);
    if (result.error || !result.user) {
      setError(result.error ?? "登录失败");
      return;
    }
    applyServerUser(result.user);
    refreshUser();
    router.push("/");
  };

  return (
    <AuthShell title="登录 AI 灵宠" subtitle="使用注册手机号或邮箱登录">
      <div className="mb-4 flex gap-1 rounded-xl border border-app-border p-0.5">
        {([["phone", "手机"], ["email", "邮箱"]] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => { setMethod(id); setCodeSent(false); setError(null); }}
            className={`flex-1 rounded-lg py-2 text-xs ${method === id ? "bg-app-accent text-white" : "text-app-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="app-card mb-4 space-y-3">
        <div>
          <label className="app-label">{method === "phone" ? "手机号" : "邮箱"}</label>
          <input
            className="app-input"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder={method === "phone" ? "11 位手机号" : "name@example.com"}
          />
        </div>

        <div className="flex gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setUseOtp(false)}
            className={!useOtp ? "font-semibold text-app-accent" : "text-app-muted"}
          >
            密码登录
          </button>
          <span className="text-app-border">|</span>
          <button
            type="button"
            onClick={() => setUseOtp(true)}
            className={useOtp ? "font-semibold text-app-accent" : "text-app-muted"}
          >
            验证码登录
          </button>
        </div>

        {useOtp ? (
          <div>
            <label className="app-label">验证码</label>
            <div className="flex gap-2">
              <input className="app-input flex-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 位验证码" />
              <button type="button" onClick={sendCode} disabled={cooldown > 0} className="shrink-0 rounded-xl border border-app-accent px-3 text-xs text-app-accent disabled:opacity-40">
                {cooldown > 0 ? `${cooldown}s` : "获取验证码"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="app-label">密码</label>
            <input type="password" className="app-input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
        )}

        {hint && <p className="text-[10px] text-app-gold">{hint}</p>}

        <SecurityCaptcha onVerified={setCaptchaOk} />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button type="button" onClick={handleLogin} disabled={loading} className="app-btn w-full disabled:opacity-50">
          {loading ? "登录中…" : "登录"}
        </button>
      </div>

      <p className="text-center text-xs text-app-muted">
        <Link href="/forgot-password" className="text-app-accent">忘记密码</Link>
        {" · "}
        <Link href="/register" className="text-app-accent">注册新账号</Link>
      </p>
    </AuthShell>
  );
}
