import type { UserProfile, UsageRecord, HistoryItem } from "./types";
import { initPetFoodForUser, canConsumePetFood, consumePetFood, grantGiftedFood, getPetFoodBalance, getTotalUses, hasUnlimitedAccess } from "./pet-food-store";
import { ensureNicknameRegistered } from "./nickname-registry";
import { safeJsonParse, safeLocalGet, safeLocalSet } from "./safe-storage";

const USER_KEY = "ai-fortune-user";
const USAGE_KEY = "ai-fortune-usage";
const HISTORY_KEY = "ai-fortune-history";
const BONUS_KEY = "ai-fortune-referral-bonuses";

const AVATAR_SEEDS = ["cosmic", "star", "moon", "sun", "dragon", "phoenix", "lotus", "cloud"];
export const REFERRAL_GIFT_BAGS = 1;
/** @deprecated use REFERRAL_GIFT_BAGS */
export const REFERRAL_BONUS_DAYS = 3;

function randomId(): string {
  return `LF${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=c45c48,d4a574,5a8a7a`;
}

function applyTrialDays(user: UserProfile, days: number): UserProfile {
  const base =
    user.trialExpiry && new Date(user.trialExpiry) > new Date()
      ? new Date(user.trialExpiry)
      : new Date();
  base.setDate(base.getDate() + days);
  return { ...user, trialExpiry: base.toISOString() };
}

function applyPendingBonuses(user: UserProfile): UserProfile {
  if (typeof window === "undefined") return user;
  try {
    const raw = safeLocalGet(BONUS_KEY);
    const bonuses = safeJsonParse<Record<string, number>>(raw, {});
    const days = bonuses[user.id];
    if (!days) return user;
    delete bonuses[user.id];
    localStorage.setItem(BONUS_KEY, JSON.stringify(bonuses));
    const updated = applyTrialDays(user, days);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return user;
  }
}

export function grantReferralBonus(inviterId: string): void {
  grantGiftedFood(inviterId, REFERRAL_GIFT_BAGS);
}

export function getTrialExpiryLabel(user: UserProfile): string | null {
  if (!user.trialExpiry) return null;
  const exp = new Date(user.trialExpiry);
  if (exp <= new Date()) return null;
  return exp.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

export function getOrCreateUser(refCode?: string): UserProfile {
  if (typeof window === "undefined") {
    return {
      id: "LF00000000",
      avatar: avatarUrl("default"),
      nickname: "访客",
      inviteCode: "LF00000000",
      createdAt: new Date().toISOString(),
    };
  }

  const existing = safeLocalGet(USER_KEY);
  if (existing) {
    try {
      let user = safeJsonParse<UserProfile>(existing, null as unknown as UserProfile);
      if (!user?.id) throw new Error("invalid user");
      initPetFoodForUser(user.id);
      ensureNicknameRegistered(user.id, user.nickname);
      if (refCode && refCode !== user.id && !user.referredBy) {
        user.referredBy = refCode;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      return applyPendingBonuses(user);
    } catch {
      localStorage.removeItem(USER_KEY);
    }
  }

  const id = randomId();
  const seed = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)] + id;
  let user: UserProfile = {
    id,
    avatar: avatarUrl(seed),
    nickname: `命理者${id.slice(-4)}`,
    inviteCode: id,
    referredBy: refCode && refCode !== id ? refCode : undefined,
    createdAt: new Date().toISOString(),
    subscription: null,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(USAGE_KEY, JSON.stringify({ lifekline: 0, bazi: 0, xiang: 0, aiAsk: 0, liuyao: 0, tarot: 0 }));
  initPetFoodForUser(id);
  ensureNicknameRegistered(id, user.nickname);

  if (refCode && refCode !== id) {
    const raw = safeLocalGet("ai-fortune-referrals");
    const refs = safeJsonParse<Record<string, string[]>>(raw, {});
    if (!refs[refCode]) refs[refCode] = [];
    if (!refs[refCode].includes(id)) {
      refs[refCode].push(id);
      localStorage.setItem("ai-fortune-referrals", JSON.stringify(refs));
      grantReferralBonus(refCode);
    }
  }

  return user;
}

export function updateUser(patch: Partial<UserProfile>): UserProfile {
  const user = getOrCreateUser();
  const updated = { ...user, ...patch };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
}

export function getUsage(): UsageRecord {
  if (typeof window === "undefined") return { lifekline: 0, bazi: 0, xiang: 0, aiAsk: 0, liuyao: 0, tarot: 0 };
  try {
    const raw = safeLocalGet(USAGE_KEY);
    const usage = safeJsonParse<Partial<UsageRecord>>(raw, {});
    return { lifekline: 0, bazi: 0, xiang: 0, aiAsk: 0, liuyao: 0, tarot: 0, ...usage };
  } catch {
    return { lifekline: 0, bazi: 0, xiang: 0, aiAsk: 0, liuyao: 0, tarot: 0 };
  }
}

export function incrementUsage(_type: keyof UsageRecord): UsageRecord {
  if (!consumePetFood()) return getUsage();
  const usage = getUsage();
  usage[_type]++;
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  return usage;
}

export function hasTrialAccess(): boolean {
  const user = getOrCreateUser();
  if (!user.trialExpiry) return false;
  return new Date(user.trialExpiry) > new Date();
}

export function hasSubscription(): boolean {
  const user = getOrCreateUser();
  if (!user.subscription || !user.subscriptionExpiry) return false;
  return new Date(user.subscriptionExpiry) > new Date();
}

export function hasActiveAccess(): boolean {
  return hasSubscription() || hasTrialAccess();
}

export function canUse(_type: keyof UsageRecord): boolean {
  return canConsumePetFood();
}

export function getRemaining(_type: keyof UsageRecord): number {
  try {
    const balance = getPetFoodBalance();
    if (hasUnlimitedAccess(balance)) return 999;
    return getTotalUses(balance);
  } catch {
    return 5;
  }
}

export function mockSubscribe(plan: "month" | "half" | "year"): UserProfile {
  const days = { month: 30, half: 183, year: 365 }[plan];
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return updateUser({
    subscription: plan,
    subscriptionExpiry: expiry.toISOString(),
  });
}

export function addHistory(item: Omit<HistoryItem, "id" | "createdAt">): void {
  const list = getHistory();
  list.unshift({
    ...item,
    id: Date.now().toString(36),
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
}

export function getHistory(type?: HistoryItem["type"]): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeLocalGet(HISTORY_KEY);
    const list = safeJsonParse<HistoryItem[]>(raw, []);
    return type ? list.filter((h) => h.type === type) : list;
  } catch {
    return [];
  }
}

export function getInviteLink(userId: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/register?ref=${userId}`;
}

export function hasRegisteredAccount(): boolean {
  if (typeof window === "undefined") return false;
  const raw = safeLocalGet(USER_KEY);
  if (!raw) return false;
  try {
    const user = safeJsonParse<UserProfile>(raw, null as unknown as UserProfile);
    return !!(user?.registeredVia === "phone" || user?.registeredVia === "email" || user?.phone || user?.email);
  } catch {
    return false;
  }
}

export function registerUser(params: {
  method: "phone" | "email";
  account: string;
  nickname?: string;
  refCode?: string;
}): UserProfile {
  if (typeof window === "undefined") {
    throw new Error("请在浏览器中注册");
  }

  const existing = safeLocalGet(USER_KEY);
  let user: UserProfile | undefined;

  if (existing) {
    try {
      const parsed = safeJsonParse<UserProfile>(existing, null as unknown as UserProfile);
      if (parsed?.registeredVia === "phone" || parsed?.registeredVia === "email" || parsed?.phone || parsed?.email) {
        throw new Error("您已注册，请直接登录使用");
      }
      if (parsed?.id) user = parsed;
    } catch (e) {
      if (e instanceof Error && e.message.includes("已注册")) throw e;
    }
  }

  if (!user?.id) {
    const id = randomId();
    const seed = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)] + id;
    user = {
      id,
      avatar: avatarUrl(seed),
      nickname: params.nickname?.trim() || `命理者${id.slice(-4)}`,
      inviteCode: id,
      createdAt: new Date().toISOString(),
      subscription: null,
    };
    safeLocalSet(USAGE_KEY, JSON.stringify({ lifekline: 0, bazi: 0, xiang: 0, aiAsk: 0, liuyao: 0, tarot: 0 }));
    initPetFoodForUser(id);
  } else if (params.nickname?.trim()) {
    user.nickname = params.nickname.trim();
  }

  user.registeredVia = params.method;
  if (params.method === "phone") user.phone = params.account;
  else user.email = params.account;

  const refCode = params.refCode && params.refCode !== user.id ? params.refCode : undefined;
  if (refCode && !user.referredBy) {
    user.referredBy = refCode;
    const raw = safeLocalGet("ai-fortune-referrals");
    const refs = safeJsonParse<Record<string, string[]>>(raw, {});
    if (!refs[refCode]) refs[refCode] = [];
    if (!refs[refCode].includes(user.id)) {
      refs[refCode].push(user.id);
      safeLocalSet("ai-fortune-referrals", JSON.stringify(refs));
      grantReferralBonus(refCode);
    }
  }

  safeLocalSet(USER_KEY, JSON.stringify(user));
  ensureNicknameRegistered(user.id, user.nickname);
  return user;
}

export function getInviteQrUrl(link: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
}

/** 服务端登录/注册成功后写入本地 */
export function applyServerUser(user: UserProfile): UserProfile {
  if (typeof window === "undefined") return user;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  initPetFoodForUser(user.id);
  ensureNicknameRegistered(user.id, user.nickname);
  return user;
}

/** 退出登录：清除本地账号并创建新访客 */
export function logoutToGuest(): UserProfile {
  if (typeof window === "undefined") {
    return getOrCreateUser();
  }
  localStorage.removeItem(USER_KEY);
  return getOrCreateUser();
}
