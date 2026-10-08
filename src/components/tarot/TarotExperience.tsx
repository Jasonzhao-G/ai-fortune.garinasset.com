"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import TarotCrystalBallOverlay from "@/components/tarot/TarotCrystalBallOverlay";
import ReportPosterButton, { SharePosterButton } from "@/components/ReportPosterButton";
import PaywallModal from "@/components/PaywallModal";
import FormattedAnalysisText from "@/components/FormattedAnalysisText";
import { ensureRegisteredAccount } from "@/lib/client/login-gate";
import TarotDrawStage from "@/components/tarot/TarotDrawStage";
import TarotSpreadDisplay from "@/components/tarot/TarotSpreadDisplay";
import BoostFortuneButton from "@/components/BoostFortuneButton";
import TarotExploreMore from "@/components/tarot/TarotExploreMore";
import { canUse, incrementUsage } from "@/lib/user-store";
import { usePetFoodRemaining } from "@/hooks/usePetFoodRemaining";
import { formatPetFoodRemaining } from "@/lib/pet-food-remaining";
import { saveRecord, buildPersonKey } from "@/lib/record-store";
import { saveSessionResult, loadSessionResult, clearSessionResult } from "@/lib/session-result-cache";
import TarotIntro from "@/components/tarot/TarotIntro";
import TarotSampleQuestions from "@/components/tarot/TarotSampleQuestions";
import { TarotHubDemo } from "@/components/fortune-hub/HubFeatureDemos";
import type { DrawnTarotCard, TarotReadingResult } from "@/lib/tarot/types";

type Phase = "form" | "drawing" | "analyzing" | "result";

interface TarotSessionState {
  question: string;
  result: TarotReadingResult;
}

interface TarotExperienceProps {
  embedded?: boolean;
}

export default function TarotExperience({ embedded }: TarotExperienceProps) {
  const [phase, setPhase] = useState<Phase>("form");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<TarotReadingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [analyzeReady, setAnalyzeReady] = useState(false);
  const pendingRef = useRef<TarotReadingResult | null>(null);
  const remaining = usePetFoodRemaining();

  useEffect(() => {
    const cached = loadSessionResult<TarotSessionState>("tarot");
    if (cached?.result) {
      setQuestion(cached.question);
      setResult(cached.result);
      setPhase("result");
    }
  }, []);

  const requestAnalysis = useCallback(async (q: string, cards: DrawnTarotCard[]) => {
    const res = await fetch("/api/tarot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, cards }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "塔罗解读失败");

    return {
      question: q,
      spreadId: "three" as const,
      spreadName: "三牌阵 · 过去 / 现在 / 未来",
      cards,
      analysis: data.analysis ?? "",
      advice: data.advice ?? "",
      theme: data.theme ?? "",
    } satisfies TarotReadingResult;
  }, []);

  const handleStart = () => {
    void (async () => {
    if (!question.trim()) return;
    if (!(await ensureRegisteredAccount())) return;
    if (!canUse("tarot")) {
      setPaywall(true);
      return;
    }
    setError(null);
    setResult(null);
    setPhase("drawing");
    })();
  };

  const handleReadyForAnalysis = useCallback(async (cards: DrawnTarotCard[]) => {
    setPhase("analyzing");
    setAnalyzeReady(false);
    pendingRef.current = null;

    try {
      const merged = await requestAnalysis(question, cards);
      pendingRef.current = merged;
      setAnalyzeReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "解读失败，请稍后重试");
      setPhase("form");
    }
  }, [question, requestAnalysis]);

  const onAnalyzeComplete = useCallback(() => {
    const merged = pendingRef.current;
    if (!merged) return;
    incrementUsage("tarot");
    setResult(merged);
    setPhase("result");
    saveSessionResult("tarot", { question, result: merged });
    saveRecord({
      type: "tarot",
      personKey: buildPersonKey("塔罗问事"),
      personName: "塔罗问事",
      personLabel: merged.question.slice(0, 24),
      title: `塔罗AI · ${merged.theme || merged.cards[1]?.card.name}`,
      summary: merged.advice,
      data: { question: merged.question, result: merged },
    });
  }, [question]);

  const handleReset = () => {
    clearSessionResult("tarot");
    setQuestion("");
    setResult(null);
    setError(null);
    setPhase("form");
  };

  return (
    <div className="page-section">
      {!embedded && (
        <p className="caption mb-3 text-app-muted">
          塔罗AI · 韦特系牌阵 · {formatPetFoodRemaining(remaining)}
        </p>
      )}

      {phase === "form" && (
        <>
          <div className="mb-4">
            <TarotIntro />
          </div>
          <div className="app-card mb-4 !p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-app-gold/15 text-lg">🔮</span>
              <div>
                <h2 className="text-sm font-semibold text-app-gold">开始占卜</h2>
                <p className="text-[11px] text-app-muted">默念问题 · 洗牌 · 选 3 张 · AI 解读</p>
              </div>
            </div>
            <label className="mb-1 block text-xs font-medium text-app-text">你想问什么？</label>
            <textarea
              className="min-h-[88px] w-full resize-none rounded-xl border border-app-border bg-app-bg/50 px-3 py-2.5 text-sm text-app-text placeholder:text-app-muted focus:border-app-gold/50 focus:outline-none focus:ring-1 focus:ring-app-gold/30"
              placeholder="例如：这段感情会走向何方？近期工作是否该变动？"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={300}
            />
            <p className="mt-1 text-right text-[10px] text-app-muted">{question.length}/300</p>
            <TarotSampleQuestions onPick={setQuestion} />
            <button
              type="button"
              onClick={handleStart}
              className="app-btn mt-4 flex w-full items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              马上开始AI占卜
            </button>
          </div>
          {error && <p className="mb-3 text-center text-xs text-red-400">{error}</p>}
          {embedded && <TarotHubDemo />}
          <div className="mt-4">
            <TarotExploreMore />
          </div>
        </>
      )}

      {phase === "drawing" && (
        <div className="app-card py-4 !p-4">
          <TarotDrawStage question={question} onReadyForAnalysis={handleReadyForAnalysis} />
        </div>
      )}

      {phase === "analyzing" && (
        <TarotCrystalBallOverlay taskReady={analyzeReady} onComplete={onAnalyzeComplete} embedded />
      )}

      {phase === "result" && result && (
        <>
          <div className="app-card mb-4 !p-4">
            <p className="mb-1 text-xs text-app-muted">所问</p>
            <p className="text-sm text-app-text">{result.question}</p>
          </div>

          <div className="app-card mb-4 overflow-hidden py-6 !p-4">
            <p className="mb-5 text-center text-sm font-semibold tracking-[0.2em] text-app-gold">牌 阵</p>
            <TarotSpreadDisplay cards={result.cards} spreadName={result.spreadName} />
            {result.theme && (
              <p className="mt-5 text-center text-xs font-medium text-app-gold/90">
                整体主题 · {result.theme}
              </p>
            )}
          </div>

          <div className="app-card mb-4 !p-4">
            <h3 className="mb-3 text-sm font-semibold text-app-gold">AI 牌阵解读</h3>
            <FormattedAnalysisText
              text={result.analysis}
              collapsedParagraphs={0}
              showLabel={false}
            />
            {result.advice && (
              <div className="mt-4">
                <h3 className="mb-3 text-sm font-semibold text-app-gold">行动建议</h3>
                <FormattedAnalysisText
                  text={`💡 ${result.advice}`}
                  collapsedParagraphs={0}
                  showLabel={false}
                />
              </div>
            )}
          </div>

          <button type="button" onClick={handleReset} className="app-btn mb-4 w-full">
            再占一次
          </button>

          <ReportPosterButton
            data={{
              title: `塔罗AI · ${result.theme || result.cards[1]?.card.name}`,
              subtitle: result.question,
              summary: result.analysis + "\n\n" + (result.advice ? `💡 ${result.advice}` : ""),
              type: "tarot",
              tarotTheme: result.theme,
              tarotCards: result.cards.map((c) => ({
                name: c.card.name,
                nameEn: c.card.nameEn,
                positionLabel: c.positionLabel,
                reversed: c.reversed,
              })),
            }}
          />
          <SharePosterButton
            data={{
              title: `塔罗AI · ${result.theme || result.cards[1]?.card.name}`,
              subtitle: result.question,
              summary: result.analysis + "\n\n" + (result.advice ? `💡 ${result.advice}` : ""),
              type: "tarot",
              tarotTheme: result.theme,
              tarotCards: result.cards.map((c) => ({
                name: c.card.name,
                nameEn: c.card.nameEn,
                positionLabel: c.positionLabel,
                reversed: c.reversed,
              })),
            }}
          />
          <div className="mt-3">
            <BoostFortuneButton />
          </div>
          <div className="mt-4">
            <TarotExploreMore />
          </div>
        </>
      )}

      <PaywallModal open={paywall} onClose={() => setPaywall(false)} feature="塔罗AI" />
    </div>
  );
}
