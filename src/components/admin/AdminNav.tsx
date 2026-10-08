"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/dashboard", label: "概览" },
  { href: "/admin/users", label: "用户" },
  { href: "/admin/orders", label: "订单" },
  { href: "/admin/community", label: "社区" },
] as const;

export default function AdminNav({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2 border-b border-app-border pb-3">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold",
            pathname === link.href || pathname.startsWith(`${link.href}/`)
              ? "bg-app-accent text-white"
              : "text-app-muted hover:bg-app-bg",
          )}
        >
          {link.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={onLogout}
        className="ml-auto rounded-lg px-3 py-1.5 text-xs text-app-muted hover:text-app-accent"
      >
        退出
      </button>
    </nav>
  );
}
