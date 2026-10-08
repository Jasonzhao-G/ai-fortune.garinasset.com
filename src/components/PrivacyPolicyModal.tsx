"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { PRIVACY_POLICY_BODY, PRIVACY_POLICY_TITLE } from "@/lib/legal/privacy-policy";

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ open, onClose }: PrivacyPolicyModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-app-border bg-app-card p-5 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4">
          <X className="h-5 w-5 text-app-muted" />
        </button>
        <h2 className="mb-3 pr-8 text-sm font-semibold text-app-text">{PRIVACY_POLICY_TITLE}</h2>
        <pre className="max-h-[50vh] whitespace-pre-wrap text-[11px] leading-relaxed text-app-muted">
          {PRIVACY_POLICY_BODY}
        </pre>
        <Link
          href="/legal/privacy"
          onClick={onClose}
          className="mt-3 block text-center text-xs text-app-accent underline"
        >
          查看完整隐私政策
        </Link>
      </div>
    </div>
  );
}
