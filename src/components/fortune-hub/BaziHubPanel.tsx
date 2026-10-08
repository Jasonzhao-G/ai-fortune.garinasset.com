"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import BirthForm from "@/components/BirthForm";
import GenerationOverlay from "@/components/GenerationOverlay";
import AnalysisPanel from "@/components/AnalysisPanel";
import PaywallModal from "@/components/PaywallModal";
import { ensureRegisteredAccount } from "@/lib/client/login-gate";
import PrimaryPersonModal from "@/components/PrimaryPersonModal";
import BoostFortuneButton from "@/components/BoostFortuneButton";
import { canUse, incrementUsage } from "@/lib/user-store";
import { usePetFoodRemaining } from "@/hooks/usePetFoodRemaining";
import { formatPetFoodRemaining } from "@/lib/pet-food-remaining";
import { saveRecord, buildPersonKey, buildPersonLabel } from "@/lib/record-store";
import { saveBirthInfo } from "@/lib/birth-store";
import { ensurePrimaryPersonBeforeCalc, getPersonDisplayName } from "@/lib/person-store";
import { saveSessionResult, loadSessionResult, clearSessionResult } from "@/lib/session-result-cache";
import { saveBaziMeasurement } from "@/lib/fortune-measurement-context";
import type { BirthInfo, BaziResult, AnalysisResult } from "@/lib/types";
import { BaziHubDemo } from "@/components/fortune-hub/HubFeatureDemos";
import BaziFlowPanel from "@/components/BaziFlowPanel";

interface BaziSessionState {
  birthInfo: BirthInfo;
  bazi: BaziResult;
  analysis: AnalysisResult;
}

export default function BaziHubPanel() {
  const [phase, setPhase] = useState<"form" | "generating" | "result">("form");
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [bazi, setBazi] = useState<BaziResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [primaryModal, setPrimaryModal] = useState(false);
  const [generateReady, setGenerateReady] = useState(false);
  const generateResultRef = useRef<BaziSessionState | null>(null);
  const remaining = usePetFoodRemaining();

  useEffect(() => {
    const cached = loadSessionResult<BaziSessionState>("bazi");
    if (cached?.birthInfo && cached.bazi && cached.analysis) {
      setBirthInfo(cached.birthInfo);
      setBazi(cached.bazi);
      setAnalysis(cached.analysis);
      setPhase("result");
    }
  }, []);

  const handleSubmit = (info: BirthInfo) => {
    void (async () => {
    if (!(await ensureRegisteredAccount())) return;
    if (!ensurePrimaryPersonBeforeCalc()) {
      setPrimaryModal(true);
      return;
    }
    if (!canUse("bazi")) {
      setPaywall(true);
      return;
    }
    setError(null);
    setBirthInfo(info);
    setPhase("generating");
    })();
  };

  useEffect(() => {
    if (phase !== "generating" || !birthInfo) return;
    setGenerateReady(false);
    generateResultRef.current = null;

    (async () => {
      try {
        const res = await fetch("/api/analyze/bazi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ birthInfo }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "八字分析失败");
        if (!data?.bazi || !data?.analysis) throw new Error("八字返回数据不完整");

        generateResultRef.current = {
          birthInfo,
          bazi: data.bazi as BaziResult,
          analysis: data.analysis as AnalysisResult,
        };
        setGenerateReady(true);
      } catch (err) {
        console.error("bazi generate failed", err);
        setError(err instanceof Error ? err.message : "八字分析失败，请稍后重试");
        setPhase("form");
      }
    })();
  }, [phase, birthInfo]);

  const onGenerateComplete = useCallback(() => {
    const pending = generateResultRef.current;
    if (!pending) return;

    setBazi(pending.bazi);
    setAnalysis(pending.analysis);
    incrementUsage("bazi");
    saveBirthInfo(pending.birthInfo);
    const personName = getPersonDisplayName(pending.birthInfo, `命理者${pending.birthInfo.year}`);
    saveRecord({
      type: "bazi",
      personKey: buildPersonKey(personName, pending.birthInfo),
      personName,
      personLabel: buildPersonLabel(personName, pending.birthInfo),
      title: "八字排盘",
      summary: pending.analysis.summary,
      data: { birthInfo: pending.birthInfo, bazi: pending.bazi, analysis: pending.analysis },
    });
    saveSessionResult("bazi", pending);
    saveBaziMeasurement(pending.birthInfo, pending.bazi, pending.analysis.summary);
    setPhase("result");
  }, []);

  if (phase === "generating") {
    return (
      <div className="relative min-h-[320px]">
        <GenerationOverlay
          embedded
          taskReady={generateReady}
          onComplete={onGenerateComplete}
          title="正在排盘"
          icon="☯"
        />
      </div>
    );
  }

  if (phase === "result" && bazi && birthInfo && analysis) {
    return (
      <div className="page-section">
        <p className="caption mb-3 text-app-muted">
          四柱八字 · {getPersonDisplayName(birthInfo)} · {formatPetFoodRemaining(remaining)}
        </p>
        <AnalysisPanel result={analysis} bazi={bazi} />
        <BaziFlowPanel birthInfo={birthInfo} bazi={bazi} />
        <div className="mt-4 space-y-2">
          <BoostFortuneButton />
          <button
            type="button"
            onClick={() => {
              clearSessionResult("bazi");
              setPhase("form");
              setBazi(null);
              setAnalysis(null);
              setBirthInfo(null);
            }}
            className="app-btn-outline w-full"
          >
            重新排盘
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="caption mb-3 text-app-muted">
        四柱八字 · 独立排盘测算 · {formatPetFoodRemaining(remaining)}
      </p>
      <div className="app-card !p-3 mb-3">
        <BirthForm onSubmit={handleSubmit} submitLabel="生成八字排盘" />
      </div>
      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
      <BaziHubDemo />
      <PaywallModal open={paywall} onClose={() => setPaywall(false)} feature="八字排盘" />
      <PrimaryPersonModal open={primaryModal} onClose={() => setPrimaryModal(false)} />
    </>
  );
}
