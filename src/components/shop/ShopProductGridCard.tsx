"use client";

import { cn } from "@/lib/utils";
import { formatPrice, type ShopProduct } from "@/lib/shop/catalog";
import { canCheckoutInApp, isExternalProduct } from "@/lib/shop/purchase";
import Badge from "@/components/ui/Badge";
import ShopProductAvatar from "@/components/shop/ShopProductAvatar";
import { ShopEmojiDisplay } from "@/components/icons/SpiritGourdIcon";

interface ShopProductGridCardProps {
  product: ShopProduct;
  onBuy?: () => void;
  onCardClick?: () => void;
  owned?: boolean;
}

export default function ShopProductGridCard({
  product,
  onBuy,
  onCardClick,
  owned,
}: ShopProductGridCardProps) {
  const comingSoon = product.availability === "coming_soon";
  const external = isExternalProduct(product);
  const buyLabel = owned ? "已拥有" : external ? "去微店" : "购买";

  return (
    <div
      role={onCardClick ? "button" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onClick={onCardClick}
      onKeyDown={
        onCardClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onCardClick();
              }
            }
          : undefined
      }
      className={cn(
        "overflow-hidden rounded-xl border border-app-border bg-app-card transition-all",
        comingSoon ? "opacity-95" : "hover:border-app-accent/40",
        onCardClick && "cursor-pointer",
      )}
    >
      <div className="flex gap-2 p-2">
        <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-app-bg to-app-accent/10">
          <ShopProductAvatar
            product={product}
            mediaSize="md"
            className="rounded-lg"
            iconClassName="h-8 w-8 text-app-gold"
          />
          {comingSoon && (
            <span className="absolute -left-0.5 -top-0.5 scale-90">
              <Badge variant="gold">即将上线</Badge>
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <p className="block-title line-clamp-1 text-[13px]">{product.name}</p>
            <p className="micro mt-0.5 line-clamp-2 leading-snug text-app-muted">{product.desc}</p>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className={cn("text-sm font-bold", comingSoon ? "text-app-muted" : "text-app-accent")}>
              {formatPrice(product.price)}
            </span>
            {!comingSoon && onBuy && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBuy();
                }}
                disabled={owned && canCheckoutInApp(product)}
                className="shrink-0 rounded-lg bg-app-accent px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                {buyLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ShopShelfGridCardProps {
  emoji: string;
  name: string;
  desc: string;
  comingSoon?: boolean;
  priceLabel?: string;
  selected?: boolean;
  onClick: () => void;
}

export function ShopShelfGridCard({
  emoji,
  name,
  desc,
  comingSoon,
  priceLabel,
  selected,
  onClick,
}: ShopShelfGridCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center rounded-xl border p-3 text-center transition-all active:scale-[0.98]",
        selected
          ? "border-app-accent bg-app-accent/10 ring-2 ring-app-accent/30"
          : "border-app-border bg-app-card hover:border-app-accent/40",
      )}
    >
      <span className="mb-1.5 flex h-11 w-11 items-center justify-center rounded-xl bg-app-bg">
        <ShopEmojiDisplay emoji={emoji} iconClassName="h-7 w-7 text-app-gold" />
      </span>
      <p className="block-title text-[13px]">{name}</p>
      <p className="micro mt-0.5 line-clamp-2">{desc}</p>
      <div className="mt-1.5">
        {comingSoon ? (
          <Badge variant="gold">即将上线</Badge>
        ) : (
          <span className="micro font-semibold text-app-accent">{priceLabel}</span>
        )}
      </div>
    </button>
  );
}
