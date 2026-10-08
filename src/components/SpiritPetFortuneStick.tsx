"use client";

import { useState, useEffect, useRef } from "react";
import type { SpiritPetProfile, BirthInfo } from "@/lib/types";
import { playLiuyaoCoinSound, type LiuyaoSoundHandle } from "@/lib/liuyao-coin-sound";
import {
  canDrawFortuneStickToday,
  drawFortuneStick,
  getSavedFortuneStick,
  saveFortuneStickResult,
  type FortuneStick,
} from "@/lib/spirit-pet-tasks";
import { hashBirth } from "@/lib/fortune-chart";
import SectionCard from "@/components/ui/SectionCard";

interface SpiritPetFortuneStickProps {
  pet: SpiritPetProfile;
  personKey: string;
  birth: BirthInfo;
}

function TempleFortuneCylinder({ shaking }: { shaking: boolean }) {
  return (
    <div className={`fortune-cylinder-wrap ${shaking ? "fortune-cylinder-shaking" : ""}`}>
      <div className="fortune-cylinder-shadow" aria-hidden />
      <div className="fortune-cylinder">
        <div className="fortune-cylinder-rim" />
        <div className="fortune-cylinder-body">
          <div className="fortune-cylinder-pattern" aria-hidden>求签</div>
          <div className="fortune-sticks-bundle">
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className="fortune-stick"
                style={{
                  left: `${18 + i * 7}%`,
                  height: `${28 + (i % 3) * 6}px`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="fortune-cylinder-base" />
      </div>
    </div>
  );
}

/** 摇签动画时长，与六爻摇卦音效一致 */
const FORTUNE_STICK_DRAW_MS = 3000;

export default function SpiritPetFortuneStick({ pet, personKey, birth }: SpiritPetFortuneStickProps) {
  const [drawing, setDrawing] = useState(false);
  const [stick, setStick] = useState<FortuneStick | null>(null);
  const [canDraw, setCanDraw] = useState(true);
  const soundRef = useRef<LiuyaoSoundHandle | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const saved = getSavedFortuneStick(personKey);
    if (saved) {
      setStick(saved);
      setCanDraw(false);
    } else {
      setCanDraw(canDrawFortuneStickToday(personKey));
    }
  }, [personKey]);

  const handleDraw = () => {
    if (!canDraw || drawing) return;
    setDrawing(true);
    soundRef.current?.stop();
    soundRef.current = playLiuyaoCoinSound();
    window.setTimeout(() => {
      const seed = hashBirth(birth) + Date.now();
      const result = drawFortuneStick(personKey, seed);
      saveFortuneStickResult(personKey, result);
      setStick(result);
      setCanDraw(false);
      setDrawing(false);
      soundRef.current?.stop();
    }, FORTUNE_STICK_DRAW_MS);
  };

  return (
    <SectionCard
      id="fortune-stick"
      variant="fortune"
      title="今日灵签"
      subtitle={`${pet.fullName} 为你解签 · 每日一签`}
      className="scroll-mt-4"
      action={<span className="text-2xl">🏮</span>}
    >
      {!stick && !drawing && canDraw && (
        <button
          type="button"
          onClick={handleDraw}
          className="fortune-draw-btn mx-auto flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-app-gold/35 bg-gradient-to-b from-[#2a1810]/40 via-app-card to-app-bg/80 px-4 py-5 transition-transform active:scale-[0.98]"
        >
          <TempleFortuneCylinder shaking={false} />
          <div className="text-center">
            <p className="block-title text-app-gold">摇动签筒 · 求灵签</p>
            <p className="caption mt-1 text-app-muted">心诚则灵 · 点击开始摇签</p>
          </div>
        </button>
      )}

      {drawing && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-app-gold/30 bg-gradient-to-b from-[#2a1810]/30 to-app-bg/50 px-4 py-6">
          <TempleFortuneCylinder shaking />
          <p className="caption font-medium text-app-gold fortune-shake-text">签筒摇动中，灵签择主…</p>
        </div>
      )}

      {stick && (
        <>
          <div className="fortune-result-scroll mx-auto max-w-sm rounded-sm border-2 border-[#c9a45c]/60 bg-gradient-to-b from-[#faf3e0] to-[#f0e4c8] p-4 text-center shadow-[inset_0_0_24px_rgba(201,164,92,0.15)]">
            <div className="mb-2 inline-block border-b border-[#c9a45c]/50 px-4 pb-1">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#8b4513]">灵 签</p>
            </div>
            <p className="text-[11px] font-semibold text-[#a0522d]">第 {stick.id} 签 · {stick.grade}签</p>
            <p className="mt-2 text-base font-bold text-[#5c3317]">{stick.title}</p>
            <p className="mt-3 text-[13px] leading-relaxed italic text-[#6b4423]/90">{stick.poem}</p>
            <div className="mt-4 rounded-lg border border-[#c9a45c]/40 bg-white/50 p-3 text-left">
              <p className="text-[10px] font-bold tracking-wider text-[#a0522d]">解签</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#5c3317]">{stick.meaning}</p>
              <p className="mt-2 text-[11px] text-[#8b6914]">💡 {stick.tip}</p>
            </div>
            {!canDraw && <p className="mt-3 text-[10px] text-[#a0522d]/70">明日再来求签</p>}
          </div>
        </>
      )}
    </SectionCard>
  );
}
