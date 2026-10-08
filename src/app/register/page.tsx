"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND_NAME } from "@/lib/brand";
import AuthShell from "@/components/auth/AuthShell";
import SecurityCaptcha from "@/components/SecurityCaptcha";
import UserAgreementModal from "@/components/UserAgreementModal";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import { authRegister, authSendCode, type AuthMethod } from "@/lib/client/auth-api";
import { applyServerUser, getOrCreateUser, hasRegisteredAccount, registerUser } from "@/lib/user-store";
import { useApp } from "@/context/AppContext";
import { registerReferral } from "@/lib/community-store";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useApp();
  const [refCode, setRefCode] = useState<string | undefined>();
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [account, setAccount] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [captchaOk, setCaptchaOk] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [useLegacy, setUseLegacy] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((v) => (v > 1 ? v - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRefCode(params.get("ref") ?? undefined);
    setAlreadyRegistered(hasRegisteredAccount());
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.loggedIn) setAlreadyRegistered(true); })
      .catch(() => undefined);
  }, []);

  const sendCode = async () => {
    if (cooldown > 0) return;
    setError(null);
    setHint(null);
    const result = await authSendCode({ method, account, purpose: "register" });
    if (result.error) {
      if (result.error.includes("未配置") || result.error.includes("503")) {
        setUseLegacy(true);
        setCodeSent(true);
        setCooldown(60);
        setHint("服务器未开认证：可暂用体验注册（无密码，仅本机）");
        return;
      }
      setError(result.error);
      return;
    }
    setUseLegacy(false);
    setCodeSent(true);
    setCooldown(60);
    if (result.demoCode) setHint(`演示验证码：${result.demoCode}`);
    else if (result.message) setHint(result.message);
  };

  const handleRegister = async () => {
    setError(null);
    if (!account.trim()) {
      setError(method === "phone" ? "请输入手机号" : "请输入邮箱");
      return;
    }
    if (!codeSent || code.length < 4) {
      setError("请输入验证码");
      return;
    }
    if (!agreedTerms || !agreedPrivacy) {
      setError("请阅读并同意用户协议与隐私政策");
      return;
    }
    if (!captchaOk) {
      setError("请完成安全验证");
      return;
    }

    if (useLegacy) {
      try {
        registerUser({
          method,
          account: account.trim(),
          nickname: nickname.trim() || undefined,
          refCode,
        });
        refreshUser();
        setSuccess(true);
        setTimeout(() => router.push("/"), 1500);
      } catch (e) {
        setError(e instanceof Error ? e.message : "注册失败");
      }
      return;
    }

    if (password !== confirm) {
      setError("两次密码不一致");
      return;
    }

    setLoading(true);
    const guest = getOrCreateUser();
    const result = await authRegister({
      method,
      account: account.trim(),
      code: code.trim(),
      password,
      nickname: nickname.trim() || undefined,
      refCode,
      existingUserId: guest.id,
    });
    setLoading(false);

    if (result.error || !result.user) {
      setError(result.error ?? "注册失败");
      return;
    }

    if (refCode && refCode !== result.user.id) {
      try { registerReferral(refCode, result.user.id); } catch { /* ignore */ }
    }
    applyServerUser(result.user);
    refreshUser();
    setSuccess(true);
    setTimeout(() => router.push("/"), 1500);
  };

  if (alreadyRegistered && !success) {
    return (
      <AuthShell title="您已登录" subtitle={`欢迎回来，${BRAND_NAME} 已为您准备好`}>
        <Link href="/" className="app-btn mx-auto block max-w-xs text-center">进入首页</Link>
        <p className="mt-4 text-center text-xs text-app-muted">
          <Link href="/login" className="text-app-accent">切换账号登录</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={`注册 ${BRAND_NAME}`}
      subtitle={refCode ? "好友邀请您加入，注册即享灵丹礼包" : "手机或邮箱注册，密码可用于登录与找回"}
    >
      <div className="mb-4 flex gap-1 rounded-xl border border-app-border p-0.5">
        {([["phone", "手机注册"], ["email", "邮箱注册"]] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => { setMethod(id); setCodeSent(false); setCode(""); setError(null); }}
            className={`flex-1 rounded-lg py-2 text-xs ${method === id ? "bg-app-accent text-white" : "text-app-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="app-card mb-4 space-y-3">
        <input
          className="app-input"
          placeholder={method === "phone" ? "11 位手机号" : "name@example.com"}
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />
        <div className="flex gap-2">
          <input className="app-input flex-1" placeholder="验证码" value={code} onChange={(e) => setCode(e.target.value)} />
          <button type="button" onClick={sendCode} disabled={cooldown > 0} className="shrink-0 rounded-xl border border-app-accent px-3 text-xs text-app-accent disabled:opacity-40">
            {cooldown > 0 ? `${cooldown}s` : "获取验证码"}
          </button>
        </div>
        {hint && <p className="text-[10px] text-app-gold">{hint}</p>}

        {!useLegacy && (
          <>
            <input type="password" className="app-input" placeholder="设置密码（8 位以上，含字母和数字）" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            <input type="password" className="app-input" placeholder="确认密码" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </>
        )}

        <input className="app-input" placeholder="昵称（选填）" value={nickname} onChange={(e) => setNickname(e.target.value)} />

        <SecurityCaptcha onVerified={setCaptchaOk} />

        <label className="flex items-start gap-2 text-[11px] text-app-muted">
          <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className="mt-0.5" />
          <span>
            我已阅读并同意
            <button type="button" className="text-app-accent underline" onClick={() => setShowAgreement(true)}>《用户服务协议》</button>
          </span>
        </label>
        <label className="flex items-start gap-2 text-[11px] text-app-muted">
          <input type="checkbox" checked={agreedPrivacy} onChange={(e) => setAgreedPrivacy(e.target.checked)} className="mt-0.5" />
          <span>
            我已阅读并同意
            <button type="button" className="text-app-accent underline" onClick={() => setShowPrivacy(true)}>《隐私政策》</button>
          </span>
        </label>
      </div>

      {error && <p className="mb-3 text-center text-xs text-red-400">{error}</p>}
      {success && <p className="mb-3 text-center text-xs text-app-green">注册成功，正在进入…</p>}

      <button type="button" onClick={handleRegister} disabled={loading} className="app-btn disabled:opacity-50">
        {loading ? "提交中…" : "完成注册"}
      </button>

      <p className="mt-4 text-center text-xs text-app-muted">
        已有账号？<Link href="/login" className="text-app-accent">登录</Link>
      </p>

      <UserAgreementModal open={showAgreement} onClose={() => setShowAgreement(false)} />
      <PrivacyPolicyModal open={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </AuthShell>
  );
}
