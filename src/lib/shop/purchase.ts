import { getWeidianStoreUrl } from "./config";
import type { ShopProduct } from "./catalog";

export type PurchaseChannel = "in_app" | "external";

export function getPurchaseChannel(product: ShopProduct): PurchaseChannel {
  if (product.purchaseChannel) return product.purchaseChannel;
  if (product.section === "virtual") return "in_app";
  return "external";
}

export function canCheckoutInApp(product: ShopProduct): boolean {
  return (
    product.availability === "available" &&
    getPurchaseChannel(product) === "in_app"
  );
}

export function resolveExternalPurchaseUrl(product: ShopProduct): string {
  const custom = product.externalPurchaseUrl?.trim();
  if (custom) return custom;
  return getWeidianStoreUrl();
}

export function isExternalProduct(product: ShopProduct): boolean {
  return getPurchaseChannel(product) === "external";
}
