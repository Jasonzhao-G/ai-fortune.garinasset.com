"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { canUse, incrementUsage, addHistory } from "@/lib/user-store";
import { ensureRegisteredAccount } from "@/lib/client/login-gate";
import { usePetFoodRemaining } from "@/hooks/usePetFoodRemaining";
import { formatPetFoodRemaining } from "@/lib/pet-food-remaining";
import { saveRecord, buildPersonKey, buildPersonLabel } from "@/lib/record-store";
import { getEffectiveBirthInfo, loadBirthInfo } from "@/lib/birth-store";
import { useApp } from "@/context/AppContext";
import PaywallModal from "@/components/PaywallModal";
import PrimaryPersonModal from "@/components/PrimaryPersonModal";
import { ensurePrimaryPersonBeforeCalc, getPersonDisplayName, getPrimaryPerson } from "@/lib/person-store";
import { hashBirth } from "@/lib/fortune-chart";
import { isValidBirthInfo, normalizeBirthInfo } from "@/lib/birth-utils";
import { grantSpiritPowerForTask } from "@/lib/spirit-pet-tasks";
import { getSpiritAbilityPrompt } from "@/lib/spirit-pet-ask";
import TypewriterText from "@/components/TypewriterText";
import SpiritPetDisplay from "@/components/SpiritPetDisplay";
import SpiritPetMediaAvatar from "@/components/SpiritPetMediaAvatar";
import {
  loadFortuneMeasurementContext,
  formatFortuneContextForPrompt,
} from "@/lib/fortune-measurement-context";
import type { BirthInfo, SpiritPetProfile } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "pet";
  text: string;
  /** 灵宠回复打字机效果 */
  animate?: boolean;
}

export const SPIRIT_PET_CHAT_PROMPTS = [
  "我今天的运势怎么样？",
  "我今天适合穿什么颜色的衣服？",
  "我今年财运如何？",
  "我今年是否适合跳槽？",
  "我的真命天子将会在什么时候出现？",
];

interface SpiritPetChatPanelProps {
  pet?: SpiritPetProfile | null;
  personName?: string;
  birthInfo?: BirthInfo | null;
  initialAbility?: string | null;
  className?: string;
  /** modal：弹层聊天；page：内嵌页面 */
  variant?: "page" | "modal";
  /** page 模式下是否显示上方灵宠档案卡片 */
  showPetProfile?: boolean;
  onClose?: () => void;
}

export default function SpiritPetChatPanel({
  pet,
  personName: ownerName = "主人",
  birthInfo: birthInfoProp,
  initialAbility,
  className = "",
  variant = "page",
  showPetProfile = true,
  onClose,
}: SpiritPetChatPanelProps) {
  const { user } = useApp();
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(birthInfoProp ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [primaryModal, setPrimaryModal] = useState(false);
  const remaining = usePetFoodRemaining();
  const messagesRef = useRef<HTMLDivElement>(null);
  const seededAbility = useRef<string | null>(null);

  useEffect(() => {
    if (birthInfoProp) {
      setBirthInfo(birthInfoProp);
      return;
    }
    const primary = getPrimaryPerson();
    if (primary?.birthInfo && isValidBirthInfo(primary.birthInfo)) {
      setBirthInfo(normalizeBirthInfo(primary.birthInfo));
      return;
    }
    setBirthInfo(getEffectiveBirthInfo() ?? loadBirthInfo());
  }, [birthInfoProp]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, loading]);

  const displayName = getPersonDisplayName(birthInfo, ownerName);

  const appendPetGreeting = useCallback(() => {
    if (!pet || messages.length > 0) return;
    setMessages([
      {
        id: "welcome",
        role: "pet",
        text: `${pet.emoji} 我是${pet.fullName}，${displayName}，有什么想问的随时跟我说～`,
      },
    ]);
  }, [pet, displayName, messages.length]);

  useEffect(() => {
    appendPetGreeting();
  }, [appendPetGreeting]);

  const sendMessage = useCallback(
    async (q: string, abilityKey?: string | null) => {
      if (!q.trim()) return;
      if (!birthInfo) return;
      if (!(await ensureRegisteredAccount())) return;
      if (!ensurePrimaryPersonBeforeCalc()) {
        setPrimaryModal(true);
        return;
      }
      if (!canUse("aiAsk")) {
        setPaywall(true);
        return;
      }

      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: q.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setDraft("");
      setLoading(true);

      let askQ = q;
      if (abilityKey) {
        const prompt = getSpiritAbilityPrompt(abilityKey);
        if (prompt?.isFortune) {
          setLoading(false);
          return;
        }
        askQ = prompt?.question ?? q;
      }

      let ans = "";
      try {
        const ctx = loadFortuneMeasurementContext();
        const measurementContext =
          ctx?.birthInfo && birthInfo && hashBirth(ctx.birthInfo) === hashBirth(birthInfo)
            ? formatFortuneContextForPrompt(ctx)
            : undefined;
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: askQ,
            birthInfo,
            petName: pet?.fullName,
            petEmoji: pet?.emoji,
            personName: getPersonDisplayName(birthInfo, user?.nickname || ownerName),
            measurementContext: measurementContext || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "AI 回答失败");
        ans = String(data.answer ?? "").trim();
        if (!ans) throw new Error("AI 返回为空");
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            id: `p-${Date.now()}`,
            role: "pet",
            text: e instanceof Error ? e.message : "AI 回答失败，请稍后重试",
          },
        ]);
        setLoading(false);
        return;
      }

      setMessages((prev) => [...prev, { id: `p-${Date.now()}`, role: "pet", text: ans, animate: true }]);
      incrementUsage("aiAsk");
      addHistory({ type: "aiAsk", title: q.slice(0, 30), data: { q, ans, birthInfo } });
      const personName = getPersonDisplayName(birthInfo, user?.nickname || ownerName);
      saveRecord({
        type: "aiAsk",
        personKey: buildPersonKey(personName, birthInfo),
        personName,
        personLabel: buildPersonLabel(personName, birthInfo),
        title: q.slice(0, 20),
        summary: ans.slice(0, 80),
        data: { question: q, answer: ans, birthInfo },
      });
      grantSpiritPowerForTask("chat");
      setLoading(false);
    },
    [birthInfo, pet, user?.nickname, ownerName],
  );

  useEffect(() => {
    if (!initialAbility || initialAbility.includes("灵签")) return;
    if (seededAbility.current === initialAbility) return;
    if (!birthInfo) return;
    const prompt = getSpiritAbilityPrompt(initialAbility);
    if (!prompt) return;
    seededAbility.current = initialAbility;
    sendMessage(prompt.question, initialAbility);
  }, [initialAbility, birthInfo, sendMessage]);

  const petEmoji = pet?.emoji ?? "🦄";

  const chatBody = (
    <div className={`app-card flex flex-col overflow-hidden !p-0 ${variant === "modal" ? "max-h-[min(78vh,560px)]" : "min-h-[320px]"}`}>
      <div className="flex items-center gap-2 border-b border-app-border px-3 py-2.5">
        {pet ? (
          <SpiritPetMediaAvatar breedId={pet.breedId} emoji={petEmoji} size="sm" className="shrink-0 border border-app-accent/20" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-app-accent/15 text-lg">
            {petEmoji}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-app-text">
            {pet?.fullName ?? "AI 灵宠"}
          </p>
          <p className="text-[10px] text-app-muted">一对一私信 · 命理陪伴 · {formatPetFoodRemaining(remaining)}</p>
        </div>
        {variant === "modal" && onClose && (
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-app-muted hover:text-app-text">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div
        ref={messagesRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
        style={{ maxHeight: variant === "modal" ? "min(52vh, 380px)" : "min(52vh, 420px)" }}
      >
          {messages.map((m) => {
            const mine = m.role === "user";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  <SpiritPetMediaAvatar
                    breedId={pet?.breedId ?? ""}
                    emoji={petEmoji}
                    size="xs"
                    className="mr-1.5 mt-1 shrink-0 border border-app-border/50"
                    animate={false}
                  />
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    mine
                      ? "rounded-br-md bg-app-accent text-white"
                      : "rounded-bl-md border border-app-border bg-app-bg text-app-text"
                  }`}
                >
                  {mine ? (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  ) : m.animate ? (
                    <TypewriterText text={m.text} className="text-xs leading-relaxed text-app-text whitespace-pre-wrap" />
                  ) : (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <SpiritPetMediaAvatar
                breedId={pet?.breedId ?? ""}
                emoji={petEmoji}
                size="xs"
                className="mr-1.5 shrink-0 border border-app-border/50"
                animate={false}
              />
              <div className="rounded-2xl rounded-bl-md border border-app-border bg-app-bg px-3 py-2 text-xs text-app-muted animate-pulse">
                正在输入…
              </div>
            </div>
          )}
        </div>

        {/* 输入区 */}
        <div className="border-t border-app-border p-3">
          {!birthInfo && (
            <p className="mb-2 text-center text-[10px] text-app-accent">
              请先在 AI 灵宠页完成收养，以便灵宠读取命格
            </p>
          )}
          <div className="flex gap-2">
            <input
              className="app-input flex-1 !py-2 text-xs"
              placeholder={birthInfo ? "和灵宠说点什么…" : "等待命格信息…"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(draft)}
              disabled={!birthInfo || loading}
            />
            <button
              type="button"
              onClick={() => sendMessage(draft)}
              disabled={loading || !draft.trim() || !birthInfo}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-app-accent text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="caption mb-1.5 mt-3 text-app-muted">试试这样问</p>
          <div className="flex flex-wrap gap-1.5">
            {SPIRIT_PET_CHAT_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => sendMessage(p)}
                disabled={!birthInfo || loading}
                className="rounded-full border border-app-border px-2.5 py-1 text-[10px] text-app-muted transition-colors hover:border-app-accent hover:text-app-accent disabled:opacity-40"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
    </div>
  );

  if (variant === "modal") {
    return (
      <div className={`fixed inset-0 z-[75] flex items-end justify-center bg-black/50 px-3 pb-4 backdrop-blur-sm sm:items-center ${className}`}>
        <div className="flex max-h-[92vh] w-full max-w-lg flex-col gap-3 overflow-y-auto">
          {showPetProfile && pet && (
            <SpiritPetDisplay pet={pet} personName={displayName} compact showInteractLink={false} />
          )}
          {chatBody}
        </div>
        <PaywallModal open={paywall} onClose={() => setPaywall(false)} feature="问AI灵宠" />
        <PrimaryPersonModal open={primaryModal} onClose={() => setPrimaryModal(false)} />
      </div>
    );
  }

  return (
    <section id="spirit-pet-chat" className={`page-section ${className}`}>
      {showPetProfile && pet && (
        <div className="mb-3">
          <SpiritPetDisplay pet={pet} personName={displayName} compact showInteractLink={false} />
        </div>
      )}
      {chatBody}
      <PaywallModal open={paywall} onClose={() => setPaywall(false)} feature="问AI灵宠" />
      <PrimaryPersonModal open={primaryModal} onClose={() => setPrimaryModal(false)} />
    </section>
  );
}
