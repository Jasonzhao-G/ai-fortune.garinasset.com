"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import BackLink from "@/components/ui/BackLink";
import Badge from "@/components/ui/Badge";
import { formatPrice, getProductBySku } from "@/lib/shop/catalog";
import ShopProductAvatar from "@/components/shop/ShopProductAvatar";
import { ownsVirtualItem } from "@/lib/shop/inventory-store";
import {
  canCheckoutInApp,
  isExternalProduct,
  resolveExternalPurchaseUrl,
} from "@/lib/shop/purchase";
import { EXTERNAL_STORE_LABEL } from "@/lib/shop/config";
import { useApp } from "@/context/AppContext";

export default function ShopProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useApp();
  const sku = params.sku as string;
  const product = getProductBySku(sku);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!product) {
      router.replace("/shop");
      return;
    }
    if (product.availability === "coming_soon") {
      router.replace("/shop");
    }
  }, [ready, product, router]);

  if (!product || product.availability === "coming_soon") {
    return null;
  }

  const external = isExternalProduct(product);
  const inApp = canCheckoutInApp(product);
  const owned =
    user != null &&
    product.virtualKind !== "food" &&
    inApp &&
    ownsVirtualItem(user.id, product.sku);

  const openExternalStore = () => {
    const url = resolveExternalPurchaseUrl(product);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <BackLink href="/shop" label="返回灵宠商城" className="mb-3" />
      <PageHeader title={product.name} subtitle={product.desc} align="left" />

      <section className="page-section">
        <div className="app-card panel-accent !p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-app-bg">
              <ShopProductAvatar
                product={product}
                mediaSize="lg"
                className="rounded-xl"
                iconClassName="h-12 w-12 text-app-gold"
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1">
                {product.tags?.map((tag) => (
                  <Badge key={tag} variant="accent">{tag}</Badge>
                ))}
                {external && (
                  <Badge variant="gold">{EXTERNAL_STORE_LABEL}发货</Badge>
                )}
                {owned && <Badge variant="success">已拥有</Badge>}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="block-title text-app-accent">{formatPrice(product.price)}</p>
                {external ? (
                  <button
                    type="button"
                    onClick={openExternalStore}
                    className="shrink-0 rounded-xl bg-app-accent px-5 py-2 text-sm font-semibold text-white"
                  >
                    去{EXTERNAL_STORE_LABEL}购买
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={owned}
                    onClick={() => router.push(`/shop/checkout?sku=${product.sku}`)}
                    className="shrink-0 rounded-xl bg-app-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {owned ? "已拥有" : "购买"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {product.detail && (
          <div className="app-card mt-2 !p-3">
            <p className="block-label mb-1 text-app-accent">商品说明</p>
            <p className="caption leading-relaxed">{product.detail}</p>
          </div>
        )}

        {external && (
          <p className="caption mt-2 px-1 text-app-muted">
            实物与 NFC 玩偶在{EXTERNAL_STORE_LABEL}完成下单与售后，本站展示价格仅供参考，以微店页面为准。
          </p>
        )}

        {product.virtualKind === "food" && (
          <p className="caption mt-2 px-1 text-app-muted">
            支付成功后灵丹立即到账，可在左上角「我的」查看余额。
          </p>
        )}
      </section>
    </>
  );
}
