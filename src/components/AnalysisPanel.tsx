"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import FormattedAnalysisText from "@/components/FormattedAnalysisText";
import type { AnalysisResult, BaziResult, AnalysisCategory } from "@/lib/types";

const CATEGORIES: { key: AnalysisCategory; label: string; icon: string }[] = [
  { key: "wealth", label: "财运", icon: "💰" },
  { key: "love", label: "桃花", icon: "💕" },
  { key: "personality", label: "性格", icon: "🧠" },
  { key: "friends", label: "朋友", icon: "👥" },
  { key: "children", label: "子女", icon: "👶" },
  { key: "family", label: "家人", icon: "🏠" },
  { key: "career", label: "事业", icon: "💼" },
  { key: "health", label: "健康", icon: "❤️" },
  { key: "safety", label: "平安", icon: "🛡️" },
];

interface AnalysisPanelProps {
  result: AnalysisResult;
  bazi?: BaziResult;
}

export default function AnalysisPanel({ result, bazi }: AnalysisPanelProps) {
  const [expanded, setExpanded] = useState<string | null>("wealth");

  const visibleCategories = CATEGORIES.filter((c) => result.categories[c.key]);

  return (
    <div className="space-y-3">
      {bazi ? (
        <>
          <div className="app-card">
            <h3 className="mb-3 text-center text-sm font-medium text-app-gold">八字排盘</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(["year", "month", "day", "hour"] as const).map((key) => (
                <div key={key} className="rounded-xl bg-app-bg py-2">
                  <div className="text-[10px] text-app-muted">
                    {{ year: "年", month: "月", day: "日", hour: "时" }[key]}
                  </div>
                  <div className="mt-0.5 text-base font-semibold text-app-accent">{bazi.bazi[key]}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-0.5 text-xs text-app-muted">
              <p>{bazi.solarDate}</p>
              <p>{bazi.lunarDate}</p>
              <p>{bazi.dayMaster} · {bazi.wuxing}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="app-card">
          <h3 className="mb-3 text-sm font-semibold text-app-gold">综合概述</h3>
          <FormattedAnalysisText text={result.summary} collapsedParagraphs={3} showLabel={false} />
        </div>
      )}

      {bazi && (
        <div className="app-card">
          <h3 className="mb-3 text-sm font-semibold text-app-gold">综合概述</h3>
          <FormattedAnalysisText text={result.summary} collapsedParagraphs={3} showLabel={false} />
        </div>
      )}

      <div className="space-y-2">
        {visibleCategories.map(({ key, label, icon }) => (
          <div key={key} className="app-card !p-0 overflow-hidden">
            <button className="flex w-full items-center justify-between px-4 py-3"
              onClick={() => setExpanded(expanded === key ? null : key)}>
              <span className="flex items-center gap-2 text-sm">
                <span>{icon}</span>
                <span className="font-semibold text-app-gold">{label}</span>
              </span>
              {expanded === key ? <ChevronUp className="h-4 w-4 text-app-muted" /> : <ChevronDown className="h-4 w-4 text-app-muted" />}
            </button>
            {expanded === key && result.categories[key] && (
              <div className="border-t border-app-border px-4 pb-4 pt-3">
                <FormattedAnalysisText text={result.categories[key]!} collapsedParagraphs={2} expandLabel="查看完整分析" showLabel={false} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
