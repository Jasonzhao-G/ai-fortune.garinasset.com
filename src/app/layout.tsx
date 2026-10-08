import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import SiteDisclaimerFooter from "@/components/SiteDisclaimerFooter";
import { DEFAULT_UI_THEME } from "@/lib/ui-themes";

export const metadata: Metadata = {
  title: "AI 灵宠 - 懂你命盘、懂你情绪的 AI 命理顾问伙伴",
  description: "八字排盘、人生K线、AI看相、六爻占卜、陪伴型灵宠",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f5f7fa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`theme-${DEFAULT_UI_THEME} light`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var u=localStorage.getItem("ai-fortune-ui-theme");var themes=["cloud","jade","dawn","ink"];var t=themes.indexOf(u)>=0?u:"cloud";var r=document.documentElement;themes.forEach(function(x){r.classList.remove("theme-"+x);});r.classList.add("theme-"+t);if(t==="ink"){r.classList.add("dark");r.classList.remove("light");}else{r.classList.add("light");r.classList.remove("dark");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen">
        <Providers>
          <TopBar />
          <main className="page-shell mx-auto min-h-screen max-w-lg pb-[72px]">
            {children}
            <SiteDisclaimerFooter />
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
