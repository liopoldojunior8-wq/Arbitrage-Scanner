import { supabase } from "./supabase";

export interface ArbitrageProduct {
  id: string;
  product_name: string;
  marketplace: string;
  buy_price: number;
  sell_price: number;
  profit: number;
  roi: number;
  product_url: string | null;
  image_url: string | null;
  created_at: string;
}

export type CreateArbitrageProduct = Omit<ArbitrageProduct, "id" | "profit" | "roi" | "created_at">;
export type UpdateArbitrageProduct = Partial<CreateArbitrageProduct>;

const TABLE = "arbitrage_products";

function computeProfitRoi(buy: number, sell: number) {
  const profit = Math.round((sell - buy) * 100) / 100;
  const roi = buy > 0 ? Math.round(((sell - buy) / buy) * 10000) / 100 : 0;
  return { profit, roi };
}

export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || url.trim() === "") return false;
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function fetchArbitrageProducts(): Promise<ArbitrageProduct[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as ArbitrageProduct[];
}

export async function fetchArbitrageProduct(id: string): Promise<ArbitrageProduct> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as ArbitrageProduct;
}

export async function createArbitrageProduct(
  input: CreateArbitrageProduct
): Promise<ArbitrageProduct> {
  const { profit, roi } = computeProfitRoi(input.buy_price, input.sell_price);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      product_name: input.product_name.trim(),
      marketplace: input.marketplace.trim(),
      buy_price: input.buy_price,
      sell_price: input.sell_price,
      profit,
      roi,
      product_url: isValidUrl(input.product_url) ? input.product_url!.trim() : null,
      image_url: input.image_url?.trim() || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ArbitrageProduct;
}

export async function updateArbitrageProduct(
  id: string,
  input: UpdateArbitrageProduct
): Promise<ArbitrageProduct> {
  const updates: Record<string, unknown> = { ...input };
  if (input.buy_price !== undefined || input.sell_price !== undefined) {
    const current = await fetchArbitrageProduct(id);
    const buy = input.buy_price ?? current.buy_price;
    const sell = input.sell_price ?? current.sell_price;
    const { profit, roi } = computeProfitRoi(buy, sell);
    updates.profit = profit;
    updates.roi = roi;
  }
  if ("product_url" in updates) {
    updates.product_url = isValidUrl(updates.product_url as string)
      ? (updates.product_url as string).trim()
      : null;
  }
  if ("image_url" in updates) {
    updates.image_url = (updates.image_url as string)?.trim() || null;
  }
  if ("product_name" in updates && typeof updates.product_name === "string") {
    updates.product_name = updates.product_name.trim();
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ArbitrageProduct;
}

export async function deleteArbitrageProduct(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
