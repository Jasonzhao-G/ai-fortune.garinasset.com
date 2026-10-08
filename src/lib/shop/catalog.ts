import { SPIRIT_GOURD_EMOJI } from "@/lib/spirit-gourd-icon";
import { PET_FOOD_PLANS } from "@/lib/pet-food-store";
import { PET_BREEDS } from "@/lib/spirit-pet";

export type ShopSection = "virtual" | "physical" | "hardware";
export type ProductAvailability = "available" | "coming_soon";
export type VirtualKind = "food" | "skin" | "necklace" | "energy";

export type ShopShelfId =
  | "food"
  | "skin"
  | "energy"
  | "decor"
  | "talisman"
  | "bracelet"
  | "ornament"
  | "pendant"
  | "experience"
  | "doll";

/** @deprecated use ShopSection */
export type ShopCategory = ShopSection;

export interface ShopShelf {
  id: ShopShelfId;
  section: ShopSection;
  name: string;
  emoji: string;
  desc: string;
}

export type PurchaseChannel = "in_app" | "external";

export interface ShopProduct {
  sku: string;
  name: string;
  section: ShopSection;
  shelfId: ShopShelfId;
  availability: ProductAvailability;
  price: number;
  emoji: string;
  desc: string;
  detail?: string;
  /** 后台可上传替换展示图 */
  imageUrl?: string;
  virtualKind?: VirtualKind;
  foodPlanId?: string;
  tags?: string[];
  petBreedId?: string;
  /** 默认：虚拟=in_app，实物/硬件=external */
  purchaseChannel?: PurchaseChannel;
  /** 单品微店链接，未设则使用 NEXT_PUBLIC_WEIDIAN_STORE_URL */
  externalPurchaseUrl?: string;
}

export const SHOP_SHELVES: ShopShelf[] = [
  { id: "food", section: "virtual", name: "灵丹", emoji: SPIRIT_GOURD_EMOJI, desc: "测算次数 · 无限套餐" },
  { id: "skin", section: "virtual", name: "皮肤", emoji: "🎨", desc: "灵宠外观 · 纯装饰" },
  { id: "energy", section: "virtual", name: "能量棒", emoji: "⚡", desc: "手持道具 · 纯装饰" },
  { id: "decor", section: "virtual", name: "装饰", emoji: "📿", desc: "项链颈饰 · 纯装饰" },
  { id: "talisman", section: "physical", name: "符咒", emoji: "🧧", desc: "手绘符箓 · 开运护身" },
  { id: "bracelet", section: "physical", name: "手串", emoji: "📿", desc: "能量手串 · 随身佩戴" },
  { id: "ornament", section: "physical", name: "摆件", emoji: "🦁", desc: "风水摆件 · 桌面开运" },
  { id: "pendant", section: "physical", name: "吊坠", emoji: "🔮", desc: "能量吊坠 · 平安守护" },
  { id: "experience", section: "physical", name: "体验卡", emoji: "🧙", desc: "真人大师 · 在线测问" },
  { id: "doll", section: "hardware", name: "灵宠玩偶", emoji: "🧸", desc: "内置芯片 · 连接 App" },
];

export const SHOP_SECTIONS: { id: ShopSection; title: string; subtitle: string }[] = [
  { id: "virtual", title: "虚拟好物", subtitle: "灵丹即时到账 · 装饰纯视觉不影响灵力" },
  { id: "physical", title: "开运实物", subtitle: "符咒 · 手串 · 摆件 · 微店发货" },
  { id: "hardware", title: "NFC实体灵宠", subtitle: "十二灵兽同款 · 微店购买 · 碰一碰绑定" },
];

const VIRTUAL_DECOR: ShopProduct[] = [
  {
    sku: "skin-cloud",
    name: "云白灵肤",
    section: "virtual",
    shelfId: "skin",
    availability: "coming_soon",
    price: 9.9,
    emoji: "🎨",
    desc: "纯装饰 · 灵宠外观皮肤",
    detail: "切换灵宠卡片为云白主题风格，不影响灵力与觉醒进度。",
    virtualKind: "skin",
    tags: ["装饰"],
  },
  {
    sku: "skin-jade",
    name: "青瓷灵肤",
    section: "virtual",
    shelfId: "skin",
    availability: "coming_soon",
    price: 9.9,
    emoji: "🎋",
    desc: "纯装饰 · 灵宠外观皮肤",
    detail: "青瓷色调守护灵光，仅改变视觉呈现。",
    virtualKind: "skin",
    tags: ["装饰"],
  },
  {
    sku: "skin-ink",
    name: "墨韵灵肤",
    section: "virtual",
    shelfId: "skin",
    availability: "coming_soon",
    price: 12.9,
    emoji: "🌙",
    desc: "纯装饰 · 灵宠外观皮肤",
    detail: "深色墨韵氛围，适合夜间陪伴场景。",
    virtualKind: "skin",
    tags: ["装饰", "热门"],
  },
  {
    sku: "necklace-gold",
    name: "金纹守护项链",
    section: "virtual",
    shelfId: "decor",
    availability: "coming_soon",
    price: 6.9,
    emoji: "📿",
    desc: "纯装饰 · 灵宠颈饰",
    detail: "为灵宠佩戴金纹项链，仅作展示，无属性加成。",
    virtualKind: "necklace",
    tags: ["装饰"],
  },
  {
    sku: "necklace-jade",
    name: "碧玉灵链",
    section: "virtual",
    shelfId: "decor",
    availability: "coming_soon",
    price: 6.9,
    emoji: "💎",
    desc: "纯装饰 · 灵宠颈饰",
    detail: "温润碧玉色链饰，装点灵宠形象。",
    virtualKind: "necklace",
    tags: ["装饰"],
  },
  {
    sku: "energy-bar",
    name: "灵力能量棒",
    section: "virtual",
    shelfId: "energy",
    availability: "coming_soon",
    price: 3.9,
    emoji: "⚡",
    desc: "纯装饰 · 手持道具",
    detail: "灵宠手持能量棒造型，纯视觉装饰，不增加灵力数值。",
    virtualKind: "energy",
    tags: ["装饰"],
  },
];

const VIRTUAL_FOOD: ShopProduct[] = PET_FOOD_PLANS.map((plan) => ({
  sku: `food-${plan.id}`,
  name: plan.label,
  section: "virtual" as const,
  shelfId: "food" as const,
  availability: "available" as const,
  price: plan.price,
  emoji: SPIRIT_GOURD_EMOJI,
  desc: plan.desc,
  detail: `购买后灵丹立即到账。${plan.desc}`,
  virtualKind: "food" as const,
  foodPlanId: plan.id,
  tags: plan.type === "unlimited" ? ["无限测算"] : ["灵丹"],
}));

const PHYSICAL: ShopProduct[] = [
  { sku: "phy-pixiu", name: "貔貅开运摆件", section: "physical", shelfId: "ornament", availability: "available", price: 168, emoji: "🦁", desc: "招财纳福 · 桌面摆件", tags: ["风水"], purchaseChannel: "external" },
  { sku: "phy-obsidian", name: "黑曜石能量手串", section: "physical", shelfId: "bracelet", availability: "available", price: 128, emoji: "⬛", desc: "辟邪护体 · 天然黑曜石", tags: ["手串"], purchaseChannel: "external" },
  { sku: "phy-fivestar", name: "五星转运串", section: "physical", shelfId: "bracelet", availability: "available", price: 198, emoji: "⭐", desc: "五行调和 · 手工编串", tags: ["手串"], purchaseChannel: "external" },
  { sku: "phy-pendant", name: "平安能量吊坠", section: "physical", shelfId: "pendant", availability: "available", price: 88, emoji: "🔮", desc: "随身守护 · 开光吊坠", tags: ["吊坠"], purchaseChannel: "external" },
  { sku: "phy-fu-wealth", name: "财运符", section: "physical", shelfId: "talisman", availability: "available", price: 58, emoji: "🧧", desc: "大师手绘 · 招财符咒", tags: ["符咒"], purchaseChannel: "external" },
  { sku: "phy-fu-noble", name: "贵人符", section: "physical", shelfId: "talisman", availability: "available", price: 58, emoji: "🎋", desc: "大师手绘 · 遇贵符咒", tags: ["符咒"], purchaseChannel: "external" },
  { sku: "phy-fu-protect", name: "防小人符", section: "physical", shelfId: "talisman", availability: "available", price: 58, emoji: "🛡️", desc: "大师手绘 · 护身符咒", tags: ["符咒"], purchaseChannel: "external" },
  { sku: "phy-master-card", name: "真人大师测问体验卡", section: "physical", shelfId: "experience", availability: "available", price: 99, emoji: "🧙", desc: "1 次真人大师在线测问", tags: ["体验卡"], purchaseChannel: "external" },
];

const HARDWARE: ShopProduct[] = PET_BREEDS.map((pet) => ({
  sku: `hw-${pet.breedId}`,
  name: `${pet.baseName}灵宠玩偶`,
  section: "hardware" as const,
  shelfId: "doll" as const,
  availability: "available" as const,
  price: 399,
  emoji: pet.emoji,
  desc: "内置芯片 · 碰一碰连接 App",
  detail: "统一款式 NFC 实体灵宠玩偶，内置芯片，收货后可与 App 绑定唤醒专属灵宠。实物请在微店下单，本站仅展示与跳转。",
  petBreedId: pet.breedId,
  tags: ["NFC实体"],
  purchaseChannel: "external" as const,
}));

export const SHOP_PRODUCTS: ShopProduct[] = [
  ...VIRTUAL_FOOD,
  ...VIRTUAL_DECOR,
  ...PHYSICAL,
  ...HARDWARE,
];

export const COMING_SOON_MESSAGE = "马上上线，敬请期待！";

export function getProductBySku(sku: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((p) => p.sku === sku);
}

export function getShelfById(id: ShopShelfId): ShopShelf | undefined {
  return SHOP_SHELVES.find((s) => s.id === id);
}

export function getShelvesBySection(section: ShopSection): ShopShelf[] {
  return SHOP_SHELVES.filter((s) => s.section === section);
}

export function getProductsByShelf(shelfId: ShopShelfId): ShopProduct[] {
  return SHOP_PRODUCTS.filter((p) => p.shelfId === shelfId);
}

export function isShelfComingSoon(shelfId: ShopShelfId): boolean {
  const products = getProductsByShelf(shelfId);
  return products.length === 0 || products.every((p) => p.availability === "coming_soon");
}

export function getShelfPriceLabel(shelfId: ShopShelfId): string {
  const products = getProductsByShelf(shelfId);
  if (products.length === 0) return "";
  const available = products.filter((p) => p.availability === "available");
  if (available.length === 0) return "即将上线";
  const min = Math.min(...available.map((p) => p.price));
  return Number.isInteger(min) ? `¥${min}起` : `¥${min.toFixed(1)}起`;
}

/** @deprecated use getProductsByShelf / section */
export function getProductsByCategory(category: ShopSection): ShopProduct[] {
  return SHOP_PRODUCTS.filter((p) => p.section === category);
}

export function formatPrice(price: number): string {
  return Number.isInteger(price) ? `¥${price}` : `¥${price.toFixed(1)}`;
}
