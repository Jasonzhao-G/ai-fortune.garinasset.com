"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Sparkles } from "lucide-react";
import { canUse, incrementUsage, addHistory } from "@/lib/user-store";
import { ensureRegisteredAccount } from "@/lib/client/login-gate";
import { usePetFoodRemaining } from "@/hooks/usePetFoodRemaining";
import { formatPetFoodRemaining } from "@/lib/pet-food-remaining";
import { saveRecord, buildPersonKey, buildPersonLabel } from "@/lib/record-store";
import { loadBirthInfo, saveBirthInfo, getEffectiveBirthInfo, formatBirthSummary } from "@/lib/birth-store";
import { useApp } from "@/context/AppContext";
import PaywallModal from "@/components/PaywallModal";
import PrimaryPersonModal from "@/components/PrimaryPersonModal";
import BirthForm from "@/components/BirthForm";
import { ensurePrimaryPersonBeforeCalc, getPersonDisplayName } from "@/lib/person-store";
import { grantSpiritPowerForTask } from "@/lib/spirit-pet-tasks";
import { getSpiritAbilityPrompt } from "@/lib/spirit-pet-ask";
import TypewriterText from "@/components/TypewriterText";
import type { BirthInfo, SpiritPetProfile } from "@/lib/types";

const PROMPTS = [
  "我今年的运势如何？",
  "我今天适合穿什么颜色的衣服？",
  "我的贵人在什么方向？",
  "我近期适合跳槽吗？",
];

interface AiAskBoxProps {
  spiritPetMode?: boolean;
  initialAbility?: string | null;
  pet?: SpiritPetProfile | null;
  personName?: string;
  birthInfo?: BirthInfo | null;
}

export default function AiAskBox({
  spiritPetMode = false,
  initialAbility,
  pet,
  personName: ownerName = "主人",
  birthInfo: birthInfoProp,
}: AiAskBoxProps) {
  const { user } = useApp();
  const [fromSpiritPet, setFromSpiritPet] = useState(spiritPetMode);

  useEffect(() => {
    setFromSpiritPet(
      spiritPetMode || new URLSearchParams(window.location.search).get("from") === "spirit-pet",
    );
  }, [spiritPetMode]);

  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(birthInfoProp ?? null);
  const [editingBirth, setEditingBirth] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [primaryModal, setPrimaryModal] = useState(false);
  const remaining = usePetFoodRemaining();
  const [answerError, setAnswerError] = useState(false);

  useEffect(() => {
    if (birthInfoProp) {
      setBirthInfo(birthInfoProp);
      setEditingBirth(false);
      return;
    }
    const saved = getEffectiveBirthInfo() ?? loadBirthInfo();
    if (saved) {
      setBirthInfo(saved);
      setEditingBirth(false);
    } else {
      setEditingBirth(!spiritPetMode);
    }
  }, [birthInfoProp, spiritPetMode]);

  const runAsk = useCallback(async (q: string, abilityKey?: string | null) => {
    if (!q.trim()) return;
    if (!birthInfo) {
      setEditingBirth(true);
      return;
    }
    if (!(await ensureRegisteredAccount())) return;
    if (!ensurePrimaryPersonBeforeCalc()) { setPrimaryModal(true); return; }
    if (!canUse("aiAsk")) { setPaywall(true); return; }

    setLoading(true);
    setQuestion(q);
    setAnswer("");
    setAnswerError(false);

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
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: askQ,
          birthInfo,
          petName: fromSpiritPet && pet ? pet.fullName : undefined,
          petEmoji: fromSpiritPet && pet ? pet.emoji : undefined,
          personName: getPersonDisplayName(birthInfo, user?.nickname || ownerName),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI 回答失败");
      ans = String(data.answer ?? "").trim();
      if (!ans) throw new Error("AI 返回为空");
    } catch (e) {
      setLoading(false);
      setAnswerError(true);
      setAnswer(e instanceof Error ? e.message : "AI 回答失败，请稍后重试");
      return;
    }

    setAnswer(ans);
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
    if (fromSpiritPet) {
      grantSpiritPowerForTask("chat");
    }
    setLoading(false);
  }, [birthInfo, fromSpiritPet, pet, user?.nickname, ownerName]);

  useEffect(() => {
    if (!initialAbility || initialAbility.includes("灵签")) {
      if (initialAbility?.includes("灵签")) {
        setQuestion(getSpiritAbilityPrompt(initialAbility)?.question ?? "");
        setAnswer("");
      }
      return;
    }
    const prompt = getSpiritAbilityPrompt(initialAbility);
    if (prompt && birthInfo) {
      runAsk(prompt.question, initialAbility);
    }
  }, [initialAbility, birthInfo, runAsk]);

  const handleBirthSave = (info: BirthInfo) => {
    const saved = saveBirthInfo(info);
    setBirthInfo(saved);
    setEditingBirth(false);
  };

  const needsBirth = !birthInfo && !spiritPetMode;

  return (
    <div className="space-y-4">
      {!spiritPetMode && (
        <div className="app-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-app-text">生辰信息</p>
            {birthInfo && !editingBirth && (
              <button
                type="button"
                onClick={() => setEditingBirth(true)}
                className="text-[11px] text-app-accent underline underline-offset-2"
              >
                修改生辰
              </button>
            )}
          </div>
          {birthInfo && !editingBirth ? (
            <div className="rounded-xl border border-app-border bg-app-bg px-3 py-2">
              <p className="text-xs text-app-text">{formatBirthSummary(birthInfo)}</p>
            </div>
          ) : (
            <BirthForm onSubmit={handleBirthSave} submitLabel={birthInfo ? "保存并更新生辰" : "确认生辰信息"} compact />
          )}
        </div>
      )}

      <div className="app-card">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-app-accent" />
            <h3 className="text-sm font-medium text-app-text">
              {fromSpiritPet ? "与灵宠对话" : "问AI灵宠"}
            </h3>
          </div>
          <span className="text-[10px] text-app-muted">{formatPetFoodRemaining(remaining)}</span>
        </div>

        {needsBirth && (
          <p className="mb-3 rounded-lg bg-app-accent/10 px-3 py-2 text-[11px] text-app-accent">
            请先填写并确认生辰信息，再进行提问
          </p>
        )}

        {!fromSpiritPet && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {PROMPTS.map((p) => (
              <button key={p} type="button" onClick={() => runAsk(p)} disabled={!birthInfo}
                className="rounded-full border border-app-border px-2.5 py-1 text-[10px] text-app-muted transition-colors hover:border-app-accent hover:text-app-accent disabled:opacity-40">
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="app-input flex-1"
            placeholder={birthInfo ? (fromSpiritPet ? "和灵宠说点什么…" : "输入您想问的问题...") : "请先确认生辰信息"}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runAsk(question)}
            disabled={needsBirth}
          />
          <button type="button" onClick={() => runAsk(question)} disabled={loading || needsBirth}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-accent text-white disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>

        {loading && (
          <p className="mt-3 text-xs text-app-accent animate-pulse">
            {pet ? `${pet.fullName}正在思考…` : "AI 灵宠正在思考…"}
          </p>
        )}
        {answer && !loading && (
          <div className={`mt-3 rounded-xl p-3 ${
            answerError
              ? "border border-red-400/30 bg-red-500/10 text-red-200"
              : "border border-app-accent/20 bg-app-bg text-app-text"
          }`}>
            {answerError ? (
              <p className="text-xs leading-relaxed">{answer}</p>
            ) : spiritPetMode ? (
              <TypewriterText key={answer} text={answer} className="text-xs leading-relaxed text-app-text whitespace-pre-wrap" />
            ) : (
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{answer}</p>
            )}
          </div>
        )}

        <PaywallModal open={paywall} onClose={() => setPaywall(false)} feature="问AI灵宠" />
        <PrimaryPersonModal open={primaryModal} onClose={() => setPrimaryModal(false)} />
      </div>
    </div>
  );
}
