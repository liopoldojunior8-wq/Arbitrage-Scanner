import { Router, type IRouter } from "express";
import { db, opportunitiesTable } from "@workspace/db";
import { eq, and, gte, sql, desc, asc } from "drizzle-orm";
import {
  ListOpportunitiesQueryParams,
  ListOpportunitiesResponse,
  GetOpportunityParams,
  GetOpportunityResponse,
  GetOpportunityStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapOpportunity(o: typeof opportunitiesTable.$inferSelect) {
  return {
    ...o,
    detectedAt: o.detectedAt.toISOString(),
    expiresAt: o.expiresAt ? o.expiresAt.toISOString() : null,
  };
}

router.get("/opportunities/stats", async (_req, res): Promise<void> => {
  const [stats] = await db
    .select({
      totalActive: sql<number>`count(*)::int`,
      avgProfit: sql<number>`avg(net_profit)::float`,
      avgRoi: sql<number>`avg(roi)::float`,
      totalPotentialProfit: sql<number>`sum(net_profit)::float`,
    })
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.status, "active"));

  const byBuy = await db
    .select({
      marketplace: opportunitiesTable.buyMarketplace,
      count: sql<number>`count(*)::int`,
      totalProfit: sql<number>`sum(net_profit)::float`,
    })
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.status, "active"))
    .groupBy(opportunitiesTable.buyMarketplace)
    .orderBy(desc(sql`sum(net_profit)`));

  const bySell = await db
    .select({
      marketplace: opportunitiesTable.sellMarketplace,
      count: sql<number>`count(*)::int`,
      totalProfit: sql<number>`sum(net_profit)::float`,
    })
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.status, "active"))
    .groupBy(opportunitiesTable.sellMarketplace)
    .orderBy(desc(sql`sum(net_profit)`));

  res.json(
    GetOpportunityStatsResponse.parse({
      totalActive: stats?.totalActive ?? 0,
      avgProfit: stats?.avgProfit ?? 0,
      avgRoi: stats?.avgRoi ?? 0,
      totalPotentialProfit: stats?.totalPotentialProfit ?? 0,
      byBuyMarketplace: byBuy,
      bySellMarketplace: bySell,
    })
  );
});

router.get("/opportunities", async (req, res): Promise<void> => {
  const params = ListOpportunitiesQueryParams.safeParse(req.query);
  const {
    status = "active",
    minProfit,
    buyMarketplace,
    sellMarketplace,
    page = 1,
    limit = 20,
    sortBy = "profit",
  } = params.success ? params.data : {};

  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(opportunitiesTable.status, status));
  }
  if (minProfit !== undefined) {
    conditions.push(gte(opportunitiesTable.netProfit, minProfit));
  }
  if (buyMarketplace) {
    conditions.push(eq(opportunitiesTable.buyMarketplace, buyMarketplace));
  }
  if (sellMarketplace) {
    conditions.push(eq(opportunitiesTable.sellMarketplace, sellMarketplace));
  }

  const orderCol =
    sortBy === "roi"
      ? desc(opportunitiesTable.roi)
      : sortBy === "profit_percent"
      ? desc(opportunitiesTable.profitPercent)
      : desc(opportunitiesTable.netProfit);

  const offset = ((page ?? 1) - 1) * (limit ?? 20);

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(opportunitiesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderCol)
      .limit(limit ?? 20)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(opportunitiesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  const mapped = items.map(mapOpportunity);
  res.json(ListOpportunitiesResponse.parse({ items: mapped, total: countResult[0]?.count ?? 0, page: page ?? 1, limit: limit ?? 20 }));
});

router.get("/opportunities/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOpportunityParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [opp] = await db.select().from(opportunitiesTable).where(eq(opportunitiesTable.id, params.data.id));
  if (!opp) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }

  res.json(GetOpportunityResponse.parse(mapOpportunity(opp)));
});

export default router;
