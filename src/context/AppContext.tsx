"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { translations, type Locale, type Theme, type Translations } from "@/lib/i18n";
import type { UserProfile } from "@/lib/types";
import { getOrCreateUser } from "@/lib/user-store";
import { syncUserToServer } from "@/lib/client/sync-user";
import { registerReferral } from "@/lib/community-store";
import { prefetchDailyFortune } from "@/lib/daily-fortune-store";
import {
  DEFAULT_UI_THEME,
  UI_THEME_STORAGE_KEY,
  UI_THEMES,
  isUiThemeId,
  type UiThemeId,
} from "@/lib/ui-themes";

interface AppContextValue {
  locale: Locale;
  theme: Theme;
  uiTheme: UiThemeId;
  t: Translations;
  user: UserProfile | null;
  setLocale: (l: Locale) => void;
  setTheme: (t: Theme) => void;
  setUiTheme: (t: UiThemeId) => void;
  refreshUser: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const UI_THEME_CLASSES = UI_THEMES.map((t) => `theme-${t.id}`);

export function applyUiTheme(uiTheme: UiThemeId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  UI_THEME_CLASSES.forEach((c) => root.classList.remove(c));
  root.classList.add(`theme-${uiTheme}`);
  root.classList.toggle("dark", uiTheme === "ink");
  root.classList.toggle("light", uiTheme !== "ink");
  const meta = UI_THEMES.find((t) => t.id === uiTheme);
  if (meta) {
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", meta.preview.bg);
  }
}

function applyLegacyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "zh";
    try {
      const saved = localStorage.getItem("ai-fortune-locale") as Locale | null;
      return saved === "en" ? "en" : "zh";
    } catch {
      return "zh";
    }
  });

  const [uiTheme, setUiThemeState] = useState<UiThemeId>(() => {
    if (typeof window === "undefined") return DEFAULT_UI_THEME;
    try {
      const saved = localStorage.getItem(UI_THEME_STORAGE_KEY);
      return isUiThemeId(saved) ? saved : DEFAULT_UI_THEME;
    } catch {
      return DEFAULT_UI_THEME;
    }
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    try {
      const savedUi = localStorage.getItem(UI_THEME_STORAGE_KEY);
      if (isUiThemeId(savedUi)) return savedUi === "ink" ? "dark" : "light";
      const saved = localStorage.getItem("ai-fortune-theme") as Theme | null;
      return saved === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    applyUiTheme(uiTheme);
  }, [uiTheme]);

  useEffect(() => {
    applyLegacyTheme(theme);
  }, [theme]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref") ?? undefined;
      const u = getOrCreateUser(ref);
      if (ref && ref !== u.id && u.referredBy === ref) {
        try { registerReferral(ref, u.id); } catch { /* ignore */ }
      }
      setUser(u);
      syncUserToServer(u);
      prefetchDailyFortune();
    } catch (err) {
      console.error("init user failed", err);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem("ai-fortune-locale", l); } catch { /* ignore */ }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem("ai-fortune-theme", t); } catch { /* ignore */ }
    if (t === "dark") {
      setUiThemeState("ink");
      try { localStorage.setItem(UI_THEME_STORAGE_KEY, "ink"); } catch { /* ignore */ }
      applyUiTheme("ink");
    } else {
      setUiThemeState("cloud");
      try { localStorage.setItem(UI_THEME_STORAGE_KEY, "cloud"); } catch { /* ignore */ }
      applyUiTheme("cloud");
    }
  }, []);

  const setUiTheme = useCallback((t: UiThemeId) => {
    setUiThemeState(t);
    try { localStorage.setItem(UI_THEME_STORAGE_KEY, t); } catch { /* ignore */ }
    applyUiTheme(t);
    const legacy: Theme = t === "ink" ? "dark" : "light";
    setThemeState(legacy);
    try { localStorage.setItem("ai-fortune-theme", legacy); } catch { /* ignore */ }
  }, []);

  const refreshUser = useCallback(() => {
    try {
      const u = getOrCreateUser();
      setUser(u);
      syncUserToServer(u);
      prefetchDailyFortune();
    } catch { /* ignore */ }
  }, []);

  const t = translations[locale];

  return (
    <AppContext.Provider value={{ locale, theme, uiTheme, t, user, setLocale, setTheme, setUiTheme, refreshUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
