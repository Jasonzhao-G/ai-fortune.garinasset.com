"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AI_DISCLAIMER_FOOTER } from "@/lib/legal/disclaimer";

export default function SiteDisclaimerFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-6 border-t border-app-border/60 px-2 pb-2 pt-4 text-center">
      <p className="text-[10px] leading-relaxed text-app-muted">{AI_DISCLAIMER_FOOTER}</p>
      <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-app-muted">
        <Link href="/legal/terms" className="underline-offset-2 hover:text-app-accent hover:underline">
          用户协议
        </Link>
        <Link href="/legal/privacy" className="underline-offset-2 hover:text-app-accent hover:underline">
          隐私政策
        </Link>
        <Link href="/login" className="underline-offset-2 hover:text-app-accent hover:underline">
          登录 / 注册
        </Link>
      </p>
    </footer>
  );
}
