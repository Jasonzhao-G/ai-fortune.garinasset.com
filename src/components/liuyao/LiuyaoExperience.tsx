"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GenerationOverlay from "@/components/GenerationOverlay";
import ReportPosterButton, { SharePosterButton } from "@/components/ReportPosterButton";
import PaywallModal from "@/components/PaywallModal";
import FormattedAnalysisText from "@/components/FormattedAnalysisText";
import { ensureRegisteredAccount } from "@/lib/client/login-gate";
import LiuyaoCoinCast from "@/components/liuyao/LiuyaoCoinCast";
import LiuyaoIntro from "@/components/liuyao/LiuyaoIntro";
import LiuyaoCastScene from "@/components/liuyao/LiuyaoCastScene";
import LiuyaoHexagramDisplay from "@/components/liuyao/LiuyaoHexagramDisplay";
import BoostFortuneButton from "@/components/BoostFortuneButton";
import { resolveHexagram, type HexagramResult, type YaoLine } from "@/lib/liuyao";
import { canUse, incrementUsage } from "@/lib/user-store";
import { usePetFoodRemaining } from "@/hooks/usePetFoodRemaining";
import { formatPetFoodRemaining } from "@/lib/pet-food-remaining";
import { saveRecord, buildPersonKey } from "@/lib/record-store";
import { grantSpiritPowerForTask } from "@/lib/spirit-pet-tasks";
import { saveSessionResult, loadSessionResult, clearSessionResult } from "@/lib/session-result-cache";
import { LiuyaoHubDemo } from "@/components/fortune-hub/HubFeatureDemos";

type Phase = "form" | "casting" | "analyzing" | "result";

interface LiuyaoSessionState {
  question: string;
  result: HexagramResult;
}

interface LiuyaoExperienceProps {
  /** 嵌入人生 K 线 Hub 时为 true */
  embedded?: boolean;
}

export default function LiuyaoExperience({ embedded }: LiuyaoExperienceProps) {
  const [phase, setPhase] = useState<Phase>("form");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<HexagramResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [analyzeReady, setAnalyzeReady] = useState(false);
  const pendingRef = useRef<HexagramResult | null>(null);
  const remaining = usePetFoodRemaining();

  useEffect(() => {
    const cached = loadSessionResult<LiuyaoSessionState>("liuyao");
    if (cached?.result) {
      setQuestion(cached.question);
      setResult(cached.result);
      setPhase("result");
    }
  }, []);

  const requestAnalysis = useCallback(async (q: string, lines: YaoLine[]) => {
    const meta = resolveHexagram(lines);
    const res = await fetch("/api/liuyao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: q,
        guaName: meta.guaName,
        guaDesc: meta.guaDesc,
        lines,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "六爻解读失败");

    const merged: HexagramResult = {
      question: q,
      lines,
      ...meta,
      luck: data.luck ?? meta.luck,
      analysis: data.analysis ?? "",
      advice: data.advice ?? "",
    };
    return merged;
  }, []);

  const handleStart = () => {
    void (async () => {
    if (!question.trim()) return;
    if (!(await ensureRegisteredAccount())) return;
    if (!canUse("liuyao")) {
      setPaywall(true);
      return;
    }
    setError(null);
    setResult(null);
    setPhase("casting");
    })();
  };

  const handleRequestAnalysis = useCallback(async (lines: YaoLine[]) => {
    setPhase("analyzing");
    setAnalyzeReady(false);
    pendingRef.current = null;

    try {
      const merged = await requestAnalysis(question, lines);
      pendingRef.current = merged;
      setAnalyzeReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "六爻解读失败，请稍后重试");
      setPhase("casting");
    }
  }, [question, requestAnalysis]);

  const handleAnalyzeComplete = useCallback(() => {
    const merged = pendingRef.current;
    if (!merged) return;

    setResult(merged);
    setPhase("result");
    incrementUsage("liuyao");
    saveRecord({
      type: "liuyao",
      personKey: buildPersonKey("六爻问卦"),
      personName: "六爻问卦",
      personLabel: merged.question.slice(0, 24),
      title: `${merged.guaName}卦 · ${merged.luck}`,
      summary: merged.advice,
      data: { question: merged.question, result: merged },
    });
    grantSpiritPowerForTask("liuyao");
    saveSessionResult("liuyao", { question: merged.question, result: merged });
  }, []);

  const handleReset = () => {
    clearSessionResult("liuyao");
    setQuestion("");
    setResult(null);
    setError(null);
    setPhase("form");
  };

  return (
    <div className="relative">
      {phase === "analyzing" && (
        <GenerationOverlay
          embedded={embedded}
          taskReady={analyzeReady}
          onComplete={handleAnalyzeComplete}
          title="正在解读卦象"
          icon="☯"
        />
      )}

      {embedded && phase === "form" && (
        <p className="caption mb-3 text-app-muted">
          诚心发问 · 三枚铜钱 · {formatPetFoodRemaining(remaining)}
        </p>
      )}

      {phase === "form" && (
        <>
          <div className="mb-3 flex justify-center">
            <LiuyaoCastScene mini sides={[2, 2, 2]} tossing={false} />
          </div>
          <div className="mb-4">
            <LiuyaoIntro />
          </div>
          <div className="app-card mb-4">
            <label className="app-label">你想问什么？</label>
            <textarea
              className="app-input min-h-[100px] resize-none"
              placeholder="例如：今年事业是否顺利？感情能否有结果？"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleStart}
            disabled={!question.trim()}
            className="app-btn"
          >
            开始爻卦
          </button>
          <p className="mt-3 text-center text-[10px] text-app-muted">
            静心默念所问之事，再以三枚铜钱逐爻起卦
          </p>
          {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}
          {embedded && <LiuyaoHubDemo />}
        </>
      )}

      {phase === "casting" && (
        <>
          <LiuyaoCoinCast
            question={question}
            onRequestAnalysis={handleRequestAnalysis}
            disabled={phase !== "casting"}
          />
          {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}
          <button
            type="button"
            onClick={() => { setPhase("form"); setError(null); }}
            className="app-btn-outline mt-3 w-full"
          >
            返回修改问题
          </button>
        </>
      )}

      {phase === "result" && result && (
        <>
          <div className="app-card mb-4">
            <p className="mb-1 text-xs text-app-muted">所问</p>
            <p className="text-sm text-app-text">{result.question}</p>
          </div>

          <div className="app-card mb-4">
            <LiuyaoHexagramDisplay
              lines={result.lines}
              guaName={result.guaName}
              guaDesc={result.guaDesc}
              trigramLabel={result.trigramLabel}
              lowerTrigram={result.lowerTrigram}
              upperTrigram={result.upperTrigram}
              luck={result.luck}
              showLuck
            />
          </div>

          <div className="app-card mb-4">
            <h3 className="mb-3 text-sm font-semibold text-app-gold">AI大模型解卦</h3>
            <FormattedAnalysisText text={result.analysis} collapsedParagraphs={0} showLabel={false} />
            {result.advice && (
              <div className="mt-4">
                <h3 className="mb-3 text-sm font-semibold text-app-gold">行动建议</h3>
                <FormattedAnalysisText text={`💡 ${result.advice}`} collapsedParagraphs={0} showLabel={false} />
              </div>
            )}
          </div>

          <button type="button" onClick={handleReset} className="app-btn mb-4 w-full">
            再来一卦
          </button>

          <ReportPosterButton
            data={{
              title: `${result.guaName}卦 · ${result.luck}`,
              subtitle: result.question.slice(0, 30),
              summary: result.analysis + "\n" + result.advice,
              type: "liuyao",
              hexagramLines: result.lines,
              guaName: result.guaName,
              guaDesc: result.guaDesc,
              luck: result.luck,
            }}
          />
          <SharePosterButton
            data={{
              title: `${result.guaName}卦 · ${result.luck}`,
              summary: result.analysis + "\n" + result.advice,
              type: "liuyao",
              hexagramLines: result.lines,
              guaName: result.guaName,
              guaDesc: result.guaDesc,
              luck: result.luck,
            }}
          />

          {embedded && (
            <div className="mt-3">
              <BoostFortuneButton />
            </div>
          )}
        </>
      )}

      <PaywallModal open={paywall} onClose={() => setPaywall(false)} feature="AI六爻" />
    </div>
  );
}
