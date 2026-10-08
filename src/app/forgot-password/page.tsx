"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import SecurityCaptcha from "@/components/SecurityCaptcha";
import { authResetPassword, authSendCode, type AuthMethod } from "@/lib/client/auth-api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [account, setAccount] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    const result = await authSendCode({ method, account, purpose: "reset" });
    if (result.error) {
      setError(result.error);
      return;
    }
    setCodeSent(true);
    setCooldown(60);
    if (result.demoCode) setHint(`演示验证码：${result.demoCode}`);
    else if (result.message) setHint(result.message);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!codeSent) {
      setError("请先获取验证码");
      return;
    }
    if (password !== confirm) {
      setError("两次密码不一致");
      return;
    }
    if (!captchaOk) {
      setError("请完成安全验证");
      return;
    }
    setLoading(true);
    const result = await authResetPassword({
      method,
      account,
      code,
      newPassword: password,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/login");
  };

  return (
    <AuthShell title="找回密码" subtitle="验证手机号或邮箱后设置新密码">
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

      <div className="app-card space-y-3">
        <input className="app-input" placeholder={method === "phone" ? "手机号" : "邮箱"} value={account} onChange={(e) => setAccount(e.target.value)} />
        <div className="flex gap-2">
          <input className="app-input flex-1" placeholder="验证码" value={code} onChange={(e) => setCode(e.target.value)} />
          <button type="button" onClick={sendCode} disabled={cooldown > 0} className="shrink-0 rounded-xl border border-app-accent px-3 text-xs text-app-accent disabled:opacity-40">
            {cooldown > 0 ? `${cooldown}s` : "获取验证码"}
          </button>
        </div>
        <input type="password" className="app-input" placeholder="新密码（8 位以上，含字母和数字）" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="password" className="app-input" placeholder="确认新密码" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {hint && <p className="text-[10px] text-app-gold">{hint}</p>}
        <SecurityCaptcha onVerified={setCaptchaOk} />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="button" onClick={handleSubmit} disabled={loading} className="app-btn w-full disabled:opacity-50">
          {loading ? "提交中…" : "重置密码"}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-app-muted">
        <Link href="/login" className="text-app-accent">返回登录</Link>
      </p>
    </AuthShell>
  );
}
