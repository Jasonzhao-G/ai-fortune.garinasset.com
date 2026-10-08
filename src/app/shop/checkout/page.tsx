"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import PageHeader from "@/components/ui/PageHeader";
import { formatPrice, getProductBySku } from "@/lib/shop/catalog";
import ShopProductAvatar from "@/components/shop/ShopProductAvatar";
import { createOrder } from "@/lib/shop/order-store";
import { canCheckoutInApp } from "@/lib/shop/purchase";
import { useApp } from "@/context/AppContext";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useApp();
  const sku = searchParams.get("sku") ?? "";
  const product = getProductBySku(sku);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!product || !canCheckoutInApp(product)) {
      router.replace("/shop");
    }
  }, [product, router]);

  if (!product) return null;

  const handleSubmit = () => {
    if (submitting || !user) return;
    setSubmitting(true);
    const order = createOrder(product.sku, user.id);
    if (order) {
      router.push(`/shop/pay/${order.id}`);
    } else {
      setSubmitting(false);
    }
  };

  return (
    <>
      <BackLink href={`/shop/product/${product.sku}`} label="返回商品" className="mb-3" />
      <PageHeader title="确认订单" subtitle="灵宠商城 · 扫码支付" align="left" />

      <section className="page-section">
        <div className="app-card">
          <p className="block-label mb-3 text-app-accent">商品清单</p>
          <div className="flex items-center gap-3 rounded-xl border border-app-border bg-app-bg/40 p-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-app-bg">
              <ShopProductAvatar
                product={product}
                mediaSize="md"
                className="rounded-xl"
                iconClassName="h-8 w-8 text-app-gold"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="block-title">{product.name}</p>
              <p className="caption">{product.desc}</p>
            </div>
            <p className="block-title text-app-accent">{formatPrice(product.price)}</p>
          </div>
        </div>

        <div className="app-card mt-3">
          <div className="flex items-center justify-between body-text">
            <span>商品金额</span>
            <span>{formatPrice(product.price)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-app-border/50 pt-2">
            <span className="block-title">应付合计</span>
            <span className="block-title text-app-gold">{formatPrice(product.price)}</span>
          </div>
        </div>

        <p className="caption mt-3 text-center">
          提交后将生成支付二维码，请扫码完成支付
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !user}
          className="app-btn mt-4 disabled:opacity-50"
        >
          {submitting ? "生成订单中..." : "提交订单 · 去支付"}
        </button>
      </section>
    </>
  );
}

export default function ShopCheckoutPage() {
  return (
    <Suspense fallback={<p className="caption text-center">加载中...</p>}>
      <CheckoutContent />
    </Suspense>
  );
}
