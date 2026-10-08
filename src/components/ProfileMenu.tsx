"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Gift, Sparkles, Globe, Mail, Info, Bell, History, UserPen, Palette, ShoppingBag, LogIn, LogOut, Shield } from "lucide-react";
import SpiritGourdIcon from "@/components/icons/SpiritGourdIcon";
import { useApp } from "@/context/AppContext";
import type { UserProfile } from "@/lib/types";
import { getInviteLink, hasRegisteredAccount, logoutToGuest } from "@/lib/user-store";
import { authLogout } from "@/lib/client/auth-api";
import { getTotalUses, getPetFoodBalance, hasUnlimitedAccess } from "@/lib/pet-food-store";
import { UI_THEMES } from "@/lib/ui-themes";
import ContactModal from "@/components/ContactModal";
import MessagesPanel, { useUnreadCount } from "@/components/MessagesPanel";
import InviteModal from "@/components/InviteModal";

interface ProfileMenuProps {
  user: UserProfile;
  open: boolean;
  onClose: () => void;
  onEditProfile?: () => void;
}

export default function ProfileMenu({ user, open, onClose, onEditProfile }: ProfileMenuProps) {
  const { uiTheme, setUiTheme, locale, setLocale, refreshUser } = useApp();
  const [showInvite, setShowInvite] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [msgKey, setMsgKey] = useState(0);
  const unread = useUnreadCount(user.id, msgKey);

  useEffect(() => {
    if (open) setMsgKey((k) => k + 1);
  }, [open]);

  useEffect(() => {
    const refresh = () => setMsgKey((k) => k + 1);
    window.addEventListener("messages-updated", refresh);
    return () => window.removeEventListener("messages-updated", refresh);
  }, []);

  if (!open) return null;

  const inviteLink = getInviteLink(user.id);
  let foodBalance;
  try {
    foodBalance = getPetFoodBalance(user.id);
  } catch {
    foodBalance = { giftedUses: 5, purchasedUses: 0 };
  }
  const foodLabel = hasUnlimitedAccess(foodBalance)
    ? "无限灵丹"
    : `${getTotalUses(foodBalance)} 次灵丹`;

  return (
    <>
      <div className="fixed inset-0 z-[80]">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto border-r border-app-border bg-app-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-app-border p-4">
            <h2 className="text-sm font-semibold text-app-text">我的</h2>
            <button onClick={onClose}><X className="h-5 w-5 text-app-muted" /></button>
          </div>

          <div className="border-b border-app-border p-4">
            <div className="flex items-center gap-3">
              <button onClick={onEditProfile} className="shrink-0">
                <img src={user.avatar} alt="" className="h-14 w-14 rounded-full border-2 border-app-gold/40 object-cover" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-app-text">{user.nickname}</p>
                <p className="text-xs text-app-muted">ID: {user.id}</p>
                {user.subscription && (
                  <span className="mt-1 inline-block rounded-full bg-app-accent/20 px-2 py-0.5 text-[10px] text-app-accent">会员</span>
                )}
                <Link
                  href="/shop/category/food"
                  onClick={onClose}
                  className="mt-1 inline-flex items-center gap-1 rounded-full bg-app-gold/20 px-2 py-0.5 text-[10px] text-app-gold"
                >
                  <SpiritGourdIcon className="h-3 w-3 text-app-gold" /> {foodLabel}
                </Link>
              </div>
            </div>
            {onEditProfile && (
              <button onClick={onEditProfile} className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-app-border py-2 text-xs text-app-accent">
                <UserPen className="h-3.5 w-3.5" /> 编辑头像与昵称
              </button>
            )}
          </div>

          <div className="p-2">
            <button
              onClick={() => { setShowMessages(true); refreshUser(); }}
              className="menu-item relative"
            >
              <span className="relative inline-flex">
                <Bell className="h-4 w-4 text-app-accent" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-app-card" />
                )}
              </span>
              消息
              {unread > 0 && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            <Link href="/records" onClick={onClose} className="menu-item">
              <History className="h-4 w-4 text-app-gold" />
              我的测算
            </Link>

            <Link href="/shop" onClick={onClose} className="menu-item">
              <ShoppingBag className="h-4 w-4 text-app-gold" />
              灵宠商城
            </Link>

            <Link href="/community" onClick={onClose} className="menu-item">
              <Sparkles className="h-4 w-4 text-app-accent" />
              社区
            </Link>

            <Link href="/spirit-pet" onClick={onClose} className="menu-item">
              <Sparkles className="h-4 w-4 text-app-gold" />
              AI 灵宠
            </Link>

            <button onClick={() => setShowInvite(true)} className="menu-item">
              <Gift className="h-4 w-4 text-app-gold" />邀请好友
            </button>
            <button onClick={() => alert("精彩活动即将上线！")} className="menu-item">
              <Sparkles className="h-4 w-4 text-app-accent" />活动
            </button>

            <div className="my-2 border-t border-app-border" />

            {hasRegisteredAccount() ? (
              <button
                type="button"
                className="menu-item w-full"
                onClick={() => {
                  void authLogout();
                  logoutToGuest();
                  refreshUser();
                  onClose();
                }}
              >
                <LogOut className="h-4 w-4 text-app-muted" />
                退出登录
              </button>
            ) : (
              <Link href="/login" onClick={onClose} className="menu-item">
                <LogIn className="h-4 w-4 text-app-accent" />
                登录 / 注册
              </Link>
            )}

            <Link href="/legal/terms" onClick={onClose} className="menu-item">
              <Shield className="h-4 w-4 text-app-muted" />
              用户协议
            </Link>
            <Link href="/legal/privacy" onClick={onClose} className="menu-item">
              <Shield className="h-4 w-4 text-app-muted" />
              隐私政策
            </Link>

            <Link href="/theme-preview" onClick={onClose} className="menu-item">
              <Palette className="h-4 w-4 text-app-accent" />
              界面风格
              <span className="ml-auto text-[11px] text-app-muted">
                {UI_THEMES.find((t) => t.id === uiTheme)?.name}
              </span>
            </Link>

            <p className="px-4 py-1 text-[10px] text-app-muted">快速切换</p>
            <div className="grid grid-cols-2 gap-1.5 px-4 pb-2">
              {UI_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setUiTheme(t.id)}
                  className={`rounded-xl border py-2 text-[11px] font-medium transition-colors ${
                    uiTheme === t.id
                      ? "border-app-accent bg-app-accent/10 text-app-accent"
                      : "border-app-border text-app-muted"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <p className="px-4 py-1 text-[10px] text-app-muted">语言</p>
            <div className="flex gap-2 px-4 pb-2">
              {(["zh", "en"] as const).map((l) => (
                <button key={l} onClick={() => setLocale(l)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-xl border py-2 text-xs ${
                    locale === l ? "border-app-accent text-app-accent" : "border-app-border text-app-muted"
                  }`}>
                  <Globe className="h-3 w-3" />{l === "zh" ? "中文" : "EN"}
                </button>
              ))}
            </div>

            <button onClick={() => setShowContact(true)} className="menu-item">
              <Mail className="h-4 w-4 text-app-muted" />联系客服
            </button>

            <div className="menu-item cursor-default hover:bg-transparent">
              <Info className="h-4 w-4 text-app-muted" />
              <span className="text-app-muted">版本 v1.3.0</span>
            </div>
          </div>
        </div>
      </div>

      <ContactModal open={showContact} onClose={() => setShowContact(false)} />
      <MessagesPanel
        userId={user.id}
        open={showMessages}
        onClose={() => { setShowMessages(false); setMsgKey((k) => k + 1); refreshUser(); }}
      />
      <InviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        userId={user.id}
        inviteLink={inviteLink}
      />
    </>
  );
}
