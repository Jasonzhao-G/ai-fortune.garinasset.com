"use client";

import { useState, useEffect } from "react";
import { Download, Share2, X, Palette } from "lucide-react";
import {
  generatePoster, downloadPoster, POSTER_STYLES, BRAND_NAME,
  type PosterData, type PosterStyle,
} from "@/lib/poster";
import { useApp } from "@/context/AppContext";
import { ensureRegisteredAccount } from "@/lib/client/login-gate";

interface ReportPosterButtonProps {
  data: Omit<PosterData, "userName">;
  label?: string;
  /** 返回 false 则中止生成 */
  onBeforeGenerate?: () => boolean;
}

export default function ReportPosterButton({ data, label = "生成报告海报", onBeforeGenerate }: ReportPosterButtonProps) {
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<PosterStyle>("classic");

  const buildData = (): PosterData => ({
    ...data,
    userName: user?.nickname,
    shareUserId: user?.id,
  });

  const openPreview = async () => {
    if (!(await ensureRegisteredAccount("登录后可生成报告海报"))) return;
    if (onBeforeGenerate && !onBeforeGenerate()) return;
    setLoading(true);
    try {
      const url = await generatePoster(buildData(), style);
      setPreview(url);
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async (newStyle: PosterStyle) => {
    setStyle(newStyle);
    setLoading(true);
    try {
      const url = await generatePoster(buildData(), newStyle);
      setPreview(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={openPreview} disabled={loading}
        className="app-btn-secondary flex items-center justify-center gap-2">
        {loading && !preview ? "生成中..." : label}
      </button>

      {preview && (
        <PosterPreviewModal
          imageUrl={preview}
          style={style}
          loading={loading}
          onStyleChange={regenerate}
          onClose={() => setPreview(null)}
          onDownload={() => downloadPoster(preview, `${BRAND_NAME}-${data.title}.png`)}
        />
      )}
    </>
  );
}

export function SharePosterButton({ data, onBeforeGenerate }: ReportPosterButtonProps) {
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<PosterStyle>("classic");

  const openPreview = async () => {
    if (!(await ensureRegisteredAccount("登录后可生成分享海报"))) return;
    if (onBeforeGenerate && !onBeforeGenerate()) return;
    setLoading(true);
    try {
      const url = await generatePoster({ ...data, userName: user?.nickname, shareUserId: user?.id }, style);
      setPreview(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={openPreview} disabled={loading}
        className="app-btn-outline mt-2 flex items-center justify-center gap-2">
        <Share2 className="h-4 w-4" />
        {loading ? "生成中..." : "分享朋友圈"}
      </button>
      {preview && (
        <PosterPreviewModal
          imageUrl={preview}
          style={style}
          loading={loading}
          onStyleChange={async (s) => {
            setStyle(s);
            setLoading(true);
            const url = await generatePoster({ ...data, userName: user?.nickname, shareUserId: user?.id }, s);
            setPreview(url);
            setLoading(false);
          }}
          onClose={() => setPreview(null)}
          onDownload={async () => {
            downloadPoster(preview, `${BRAND_NAME}-分享.png`);
            if (navigator.share) {
              try {
                await navigator.share({ title: data.title, text: data.summary.slice(0, 100) });
              } catch { /* cancelled */ }
            }
          }}
        />
      )}
    </>
  );
}

function PosterPreviewModal({
  imageUrl, style, loading, onStyleChange, onClose, onDownload,
}: {
  imageUrl: string;
  style: PosterStyle;
  loading: boolean;
  onStyleChange: (s: PosterStyle) => void;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-app-border bg-app-card p-4 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-app-text">报告海报预览</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-app-muted" /></button>
        </div>

        <div className="relative mb-3 overflow-hidden rounded-xl border border-app-border bg-black">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-xs text-white animate-pulse">切换风格中...</span>
            </div>
          )}
          <img src={imageUrl} alt="海报预览" className="w-full" />
        </div>

        <div className="mb-3">
          <p className="mb-2 flex items-center gap-1 text-xs text-app-muted">
            <Palette className="h-3.5 w-3.5" /> 更换海报风格
          </p>
          <div className="flex gap-2">
            {POSTER_STYLES.map(({ id, label: l }) => (
              <button key={id} onClick={() => onStyleChange(id)}
                className={`flex-1 rounded-xl border py-2 text-[10px] ${
                  style === id ? "border-app-accent bg-app-accent/10 text-app-accent" : "border-app-border text-app-muted"
                }`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onDownload} className="app-btn flex items-center justify-center gap-2">
          <Download className="h-4 w-4" /> 下载到本地
        </button>
      </div>
    </div>
  );
}
