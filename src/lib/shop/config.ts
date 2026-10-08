/** 官方微店（可在 Vercel 配置 NEXT_PUBLIC_WEIDIAN_STORE_URL） */
export function getWeidianStoreUrl(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_WEIDIAN_STORE_URL
      : undefined;
  return (fromEnv?.trim() || "https://weidian.com").replace(/\/$/, "");
}

export const EXTERNAL_STORE_LABEL = "微店";
