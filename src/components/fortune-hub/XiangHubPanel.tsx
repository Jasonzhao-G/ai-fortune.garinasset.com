"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import ImageUpload from "@/components/ImageUpload";
import AnalysisPanel from "@/components/AnalysisPanel";
import XiangScanOverlay from "@/components/XiangScanOverlay";
import GenerationOverlay from "@/components/GenerationOverlay";
import PaywallModal from "@/components/PaywallModal";
import { ensureRegisteredAccount } from "@/lib/client/login-gate";
import ReportPosterButton, { SharePosterButton } from "@/components/ReportPosterButton";
import { canUse, incrementUsage, addHistory } from "@/lib/user-store";
import { usePetFoodRemaining } from "@/hooks/usePetFoodRemaining";
import { formatPetFoodRemaining } from "@/lib/pet-food-remaining";
import { saveRecord, buildPersonKey, buildPersonLabel } from "@/lib/record-store";
import PrimaryPersonModal from "@/components/PrimaryPersonModal";
import { ensurePrimaryPersonBeforeCalc, getPersonDisplayName } from "@/lib/person-store";
import { getEffectiveBirthInfo } from "@/lib/birth-store";
import XiangDemoDiagram from "@/components/XiangDemoDiagram";
import BoostFortuneButton from "@/components/BoostFortuneButton";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { analyzeXiangImage } from "@/lib/xiang-analyze-client";
import { saveSessionResult, loadSessionResult, clearSessionResult } from "@/lib/session-result-cache";
import { XiangHubDemo } from "@/components/fortune-hub/HubFeatureDemos";
import type { AnalysisResult } from "@/lib/types";

type Tab = "palm" | "face";

const XIANG_TABS = [
  { id: "palm" as const, label: "手相" },
  { id: "face" as const, label: "面相" },
];

export default function XiangHubPanel() {
  const [tab, setTab] = useState<Tab>("palm");
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [analyzeReady, setAnalyzeReady] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [primaryModal, setPrimaryModal] = useState(false);
  const [pendingType, setPendingType] = useState<Tab>("palm");
  const pendingPreview = useRef<string | null>(null);
  const resultRef = useRef<AnalysisResult | null>(null);
  const remaining = usePetFoodRemaining();

  useEffect(() => {
    const cached = loadSessionResult<{ tab: Tab; preview: string; result: AnalysisResult }>("xiang");
    if (cached?.result && cached.preview) {
      setTab(cached.tab);
      setPreview(cached.preview);
      setResult(cached.result);
    }
  }, []);

  useEffect(() => {
    if (!scanning) return;
    const image = pendingPreview.current;
    if (!image) return;

    setAnalyzeReady(false);
    resultRef.current = null;

    (async () => {
      setAnalyzeError(null);
      try {
        const { analysis } = await analyzeXiangImage(pendingType, image);
        resultRef.current = analysis;
        setAnalyzeReady(true);
      } catch {
        setAnalyzeError("分析暂时失败，请重试或更换图片");
        setScanning(false);
      }
    })();
  }, [scanning, pendingType]);

  const onAnalyzeComplete = useCallback(() => {
    const analysis = resultRef.current;
    const image = pendingPreview.current;
    if (!analysis || !image) {
      setScanning(false);
      return;
    }

    setResult(analysis);
    incrementUsage("xiang");
    addHistory({
      type: "xiang",
      title: pendingType === "palm" ? "手相分析" : "面相分析",
      data: analysis,
    });
    const birthInfo = getEffectiveBirthInfo();
    const personName = getPersonDisplayName(birthInfo, "看相用户");
    saveRecord({
      type: "xiang",
      personKey: buildPersonKey(personName, birthInfo ?? undefined),
      personName,
      personLabel: birthInfo ? buildPersonLabel(personName, birthInfo) : personName,
      title: pendingType === "palm" ? "手相看相" : "面相看相",
      summary: analysis.summary,
      data: { ...analysis, tab: pendingType },
    });
    saveSessionResult("xiang", { tab: pendingType, preview: image, result: analysis });
    setScanning(false);
  }, [pendingType]);

  const startAnalyze = () => {
    void (async () => {
    if (!preview) return;
    if (!(await ensureRegisteredAccount())) return;
    if (!ensurePrimaryPersonBeforeCalc()) { setPrimaryModal(true); return; }
    if (!canUse("xiang")) { setPaywall(true); return; }
    setPendingType(tab);
    pendingPreview.current = preview;
    setResult(null);
    setScanning(true);
    })();
  };

  const scanLabel = tab === "palm" ? "手相矩阵扫描中…" : "面相矩阵扫描中…";

  return (
    <div className="relative">
      <p className="caption mb-3 text-app-muted">AI 智能 · 手相 & 面相 · {formatPetFoodRemaining(remaining)}</p>

      <SegmentedControl
        value={tab}
        options={XIANG_TABS}
        onChange={(t) => { setTab(t); setPreview(null); setResult(null); setScanning(false); }}
      />

      {!scanning && (
        <ImageUpload
          label={tab === "palm" ? "上传手相照片" : "上传面相照片"}
          hint={tab === "palm" ? "手掌平放，掌纹清晰" : "正面拍摄，光线均匀"}
          preview={preview}
          onImageSelect={setPreview}
          onClear={() => { setPreview(null); setResult(null); }}
        />
      )}

      {scanning && preview && (
        <div className="relative min-h-[280px]">
          <XiangScanOverlay imageUrl={preview} label={analyzeReady ? "命相解析完成…" : scanLabel} />
          <GenerationOverlay
            embedded
            taskReady={analyzeReady}
            onComplete={onAnalyzeComplete}
            title="正在看相"
            icon="☯"
          />
        </div>
      )}

      {!preview && !result && !scanning && (
        <div className="mt-4 app-card">
          <p className="mb-2 text-xs font-medium text-app-text">{tab === "palm" ? "手相" : "面相"}拍摄指引</p>
          <div className="mb-3 rounded-xl border border-dashed border-app-border bg-app-bg/50 px-2 py-3">
            <XiangDemoDiagram type={tab} />
          </div>
          <p className="text-xs leading-relaxed text-app-text">上传照片后点击「AI 大师看相分析」，将基于你的图片实时生成专属解读。</p>
        </div>
      )}

      {!preview && !result && !scanning && <XiangHubDemo />}

      {preview && !result && !scanning && (
        <>
          <button onClick={startAnalyze} className="app-btn mt-4">AI 大师看相分析</button>
          {analyzeError && <p className="mt-2 text-center text-xs text-red-400">{analyzeError}</p>}
        </>
      )}

      {result && (
        <div className="mt-4">
          <AnalysisPanel result={result} />
          <div className="mt-3">
            <BoostFortuneButton />
          </div>
          <button onClick={() => { clearSessionResult("xiang"); setPreview(null); setResult(null); }} className="app-btn-outline mt-3">
            再次测算
          </button>
        </div>
      )}

      <PaywallModal open={paywall} onClose={() => setPaywall(false)} feature="看相" />
      <PrimaryPersonModal open={primaryModal} onClose={() => setPrimaryModal(false)} />
    </div>
  );
}
