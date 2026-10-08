import Link from "next/link";
import { BRAND_LOGO } from "@/lib/brand";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 pb-8 pt-4">
      <div className="mb-6 text-center">
        <span className="text-3xl">{BRAND_LOGO}</span>
        <h1 className="page-title mt-2">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-app-muted">{subtitle}</p>}
      </div>
      {children}
      <p className="mt-6 text-center text-[10px] text-app-muted">
        <Link href="/" className="text-app-accent">返回首页</Link>
      </p>
    </div>
  );
}
