"use client";

import Link from "next/link";
import { X } from "lucide-react";

interface LoginRequiredModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export default function LoginRequiredModal({
  open,
  onClose,
  message = "登录或注册后即可使用生成、发帖等功能，浏览页面无需登录。",
}: LoginRequiredModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-sm rounded-2xl border border-app-border bg-app-card p-5 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 text-app-muted">
          <X className="h-5 w-5" />
        </button>
        <h2 className="pr-8 text-sm font-semibold text-app-text">需要登录</h2>
        <p className="caption mt-2 leading-relaxed text-app-muted">{message}</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link href="/login" onClick={onClose} className="app-btn text-center !mb-0">
            登录
          </Link>
          <Link href="/register" onClick={onClose} className="app-btn-secondary text-center">
            注册新账号
          </Link>
        </div>
      </div>
    </div>
  );
}
