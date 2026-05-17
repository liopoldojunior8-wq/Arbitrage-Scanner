import { Router, type IRouter } from "express";
import { db, productsTable, priceHistoryTable } from "@workspace/db";
import { eq, ilike, and, sql, desc, or } from "drizzle-orm";
import {
  ListProductsQueryParams,
  ListProductsResponse,
  CreateProductBody,
  GetProductParams,
  GetProductResponse,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
  GetProductPriceHistoryParams,
  GetProductPriceHistoryResponse,
  ToggleProductFavoriteParams,
  ToggleProductFavoriteResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  const { search, marketplace, category, page = 1, limit = 20 } = params.success ? params.data : {};

  const conditions = [];
  if (search) {
    conditions.push(or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.sku, `%${search}%`)));
  }
  if (marketplace) {
    conditions.push(eq(productsTable.marketplace, marketplace));
  }
  if (category) {
    conditions.push(eq(productsTable.category, category));
  }

  const offset = ((page ?? 1) - 1) * (limit ?? 20);

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(productsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(productsTable.createdAt))
      .limit(limit ?? 20)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  const mapped = items.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  res.json(ListProductsResponse.parse({ items: mapped, total: countResult[0]?.count ?? 0, page: page ?? 1, limit: limit ?? 20 }));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      name: parsed.data.name,
      sku: parsed.data.sku ?? "",
      asin: parsed.data.asin ?? null,
      marketplace: parsed.data.marketplace,
      currentPrice: parsed.data.targetPrice,
      targetPrice: parsed.data.targetPrice,
      imageUrl: parsed.data.imageUrl ?? "",
      category: parsed.data.category,
    })
    .returning();

  res.status(201).json(GetProductResponse.parse({ ...product, createdAt: product.createdAt.toISOString() }));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse({ ...product, createdAt: product.createdAt.toISOString() }));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = UpdateProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const body = UpdateProductBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (body.data.targetPrice !== undefined) updates.targetPrice = body.data.targetPrice;
  if (body.data.isActive !== undefined) updates.isActive = body.data.isActive;
  if (body.data.category !== undefined) updates.category = body.data.category;
  updates.updatedAt = new Date();

  const [product] = await db
    .update(productsTable)
    .set(updates)
    .where(eq(productsTable.id, paramsResult.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(UpdateProductResponse.parse({ ...product, createdAt: product.createdAt.toISOString() }));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/products/:id/price-history/:period", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductPriceHistoryParams.safeParse({
    id: parseInt(rawId, 10),
    period: req.params.period,
  });
  if (!params.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const periodDays: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };
  const days = periodDays[params.data.period] ?? 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await db
    .select()
    .from(priceHistoryTable)
    .where(and(eq(priceHistoryTable.productId, params.data.id)))
    .orderBy(priceHistoryTable.recordedAt);

  const mapped = rows.map((r) => ({
    date: r.recordedAt.toISOString(),
    price: r.price,
    marketplace: r.marketplace,
  }));

  res.json(GetProductPriceHistoryResponse.parse(mapped));
});

router.patch("/products/:id/toggle-favorite", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ToggleProductFavoriteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const [current] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!current) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set({ isFavorite: !current.isFavorite })
    .where(eq(productsTable.id, params.data.id))
    .returning();

  res.json(ToggleProductFavoriteResponse.parse({ ...product, createdAt: product.createdAt.toISOString() }));
});

export default router;
