"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, ChevronLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import PageCarouselBanner from "@/components/PageCarouselBanner";
import ComingSoonModal from "@/components/shop/ComingSoonModal";
import ShopProductGridCard, { ShopShelfGridCard } from "@/components/shop/ShopProductGridCard";
import { PAGE_BANNERS } from "@/lib/page-banners";
import {
  COMING_SOON_MESSAGE,
  getProductsByShelf,
  getShelfById,
  getShelfPriceLabel,
  getShelvesBySection,
  isShelfComingSoon,
  SHOP_SECTIONS,
  type ShopSection,
  type ShopShelfId,
} from "@/lib/shop/catalog";
import { ownsVirtualItem } from "@/lib/shop/inventory-store";
import {
  canCheckoutInApp,
  isExternalProduct,
  resolveExternalPurchaseUrl,
} from "@/lib/shop/purchase";
import { useApp } from "@/context/AppContext";
import type { ShopProduct } from "@/lib/shop/catalog";
import { cn } from "@/lib/utils";
import { ShopEmojiDisplay } from "@/components/icons/SpiritGourdIcon";

export default function ShopPage() {
  return (
    <Suspense fallback={<p className="caption text-center text-app-muted">加载商城…</p>}>
      <ShopPageContent />
    </Suspense>
  );
}

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useApp();
  const [section, setSection] = useState<ShopSection>("virtual");
  const [activeShelf, setActiveShelf] = useState<ShopShelfId | null>(null);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  useEffect(() => {
    const s = searchParams.get("section");
    if (s === "virtual" || s === "physical" || s === "hardware") {
      setSection(s);
      setActiveShelf(null);
    }
  }, [searchParams]);

  const shelves = getShelvesBySection(section);
  const shelf = activeShelf ? getShelfById(activeShelf) : null;
  const products = activeShelf ? getProductsByShelf(activeShelf) : [];

  const handleSectionChange = (id: ShopSection) => {
    setSection(id);
    setActiveShelf(null);
  };

  const handleProductClick = (product: ShopProduct) => {
    if (product.availability === "coming_soon") {
      setComingSoonOpen(true);
      return;
    }
    router.push(`/shop/product/${product.sku}`);
  };

  const handleProductBuy = (product: ShopProduct) => {
    if (product.availability === "coming_soon") {
      setComingSoonOpen(true);
      return;
    }
    if (isExternalProduct(product)) {
      window.open(resolveExternalPurchaseUrl(product), "_blank", "noopener,noreferrer");
      return;
    }
    if (canCheckoutInApp(product)) {
      router.push(`/shop/checkout?sku=${product.sku}`);
    }
  };

  return (
    <>
      <PageHeader
        title="灵宠商城"
        subtitle="虚实相伴 · 开运好物"
        actions={
          <Link href="/shop/orders" className="back-link !min-w-0 shrink-0">
            <Package className="h-4 w-4" />
            订单
          </Link>
        }
      />

      <PageCarouselBanner slides={PAGE_BANNERS.shop} className="!mb-4 !pt-0" />

      {/* 三大类横排 */}
      <div className="mb-4 flex gap-2">
        {SHOP_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleSectionChange(s.id)}
            className={cn(
              "flex-1 rounded-xl border px-2 py-2.5 text-center transition-all",
              section === s.id
                ? "border-app-accent bg-app-accent text-white shadow-sm"
                : "border-app-border bg-app-card text-app-muted hover:border-app-accent/50",
            )}
          >
            <p className="text-[12px] font-bold leading-tight">{s.title}</p>
          </button>
        ))}
      </div>

      {!activeShelf ? (
        <section className="page-section">
          <p className="caption mb-3 text-app-muted">
            {SHOP_SECTIONS.find((s) => s.id === section)?.subtitle}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {shelves.map((sh) => (
              <ShopShelfGridCard
                key={sh.id}
                emoji={sh.emoji}
                name={sh.name}
                desc={sh.desc}
                comingSoon={isShelfComingSoon(sh.id)}
                priceLabel={getShelfPriceLabel(sh.id)}
                onClick={() => setActiveShelf(sh.id)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="page-section">
          <button
            type="button"
            onClick={() => setActiveShelf(null)}
            className="mb-3 inline-flex items-center gap-1 caption font-semibold text-app-accent"
          >
            <ChevronLeft className="h-4 w-4" />
            返回 {SHOP_SECTIONS.find((s) => s.id === section)?.title}
          </button>

          {shelf && (
            <div className="app-card panel-gold mb-4 flex items-center gap-3 !py-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-app-gold/15">
                <ShopEmojiDisplay emoji={shelf.emoji} iconClassName="h-8 w-8 text-app-gold" />
              </span>
              <div className="min-w-0">
                <p className="block-title text-app-gold">{shelf.name}</p>
                <p className="caption">{shelf.desc}</p>
              </div>
              {isShelfComingSoon(shelf.id) && <BadgeInline />}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ShopProductGridCard
                key={product.sku}
                product={product}
                onCardClick={() => handleProductClick(product)}
                owned={
                  user != null &&
                  product.section === "virtual" &&
                  product.virtualKind !== "food" &&
                  ownsVirtualItem(user.id, product.sku)
                }
                onBuy={
                  product.availability === "available"
                    ? () => handleProductBuy(product)
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      <ComingSoonModal
        open={comingSoonOpen}
        onClose={() => setComingSoonOpen(false)}
        title={COMING_SOON_MESSAGE}
      />
    </>
  );
}

function BadgeInline() {
  return (
    <span className="shrink-0 rounded-full border border-app-gold/40 bg-app-gold/15 px-2 py-0.5 text-[10px] font-semibold text-app-gold">
      即将上线
    </span>
  );
}
