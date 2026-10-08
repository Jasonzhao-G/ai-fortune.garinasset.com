"use client";

import { useCallback, useEffect, useState } from "react";

export function useAdminSession() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [dbConfigured, setDbConfigured] = useState(false);
  const [adminConfigured, setAdminConfigured] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/session", { credentials: "include" });
      const data = await res.json();
      setLoggedIn(!!data.loggedIn);
      setDbConfigured(!!data.dbConfigured);
      setAdminConfigured(!!data.adminConfigured);
    } catch {
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = async (password: string) => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "登录失败");
    }
    await refresh();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    await refresh();
  };

  return {
    loading,
    loggedIn,
    dbConfigured,
    adminConfigured,
    login,
    logout,
    refresh,
  };
}
