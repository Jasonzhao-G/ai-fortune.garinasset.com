"use client";

import { useEffect, useState } from "react";
import { useAdminSession } from "@/components/admin/useAdminSession";

interface Stats {
  dbConfigured: boolean;
  totalUsers: number;
  registeredUsers: number;
  payingUsers: number;
  paidOrders: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const { dbConfigured } = useAdminSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/stats", { credentials: "include" });
        if (!res.ok) throw new Error("无法加载统计");
        setStats(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      }
    })();
  }, []);

  return (
    <>
      <header className="mb-4">
        <h1 className="page-title">数据概览</h1>
        <p className="caption text-app-muted">用户与虚拟商品订单（服务端统计）</p>
      </header>

      {!dbConfigured && (
        <p className="app-card caption text-app-gold">
          未配置 DATABASE_URL：用户同步与订单不会写入数据库，以下数据为 0。
        </p>
      )}

      {error && <p className="caption text-red-500">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="累计用户（访问同步）" value={stats.totalUsers} />
          <StatCard label="注册用户（手机/邮箱）" value={stats.registeredUsers} />
          <StatCard label="付费用户（去重）" value={stats.payingUsers} />
          <StatCard label="成功订单数" value={stats.paidOrders} />
          <StatCard
            label="成交额（元）"
            value={stats.totalRevenue.toFixed(2)}
            className="col-span-2"
          />
        </div>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={`app-card ${className ?? ""}`}>
      <p className="caption text-app-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-app-accent">{value}</p>
    </div>
  );
}
