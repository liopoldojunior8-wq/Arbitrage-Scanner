import { Router, type IRouter } from "express";
import { db, marketplacesTable } from "@workspace/db";
import { ListMarketplacesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/marketplaces", async (_req, res): Promise<void> => {
  const marketplaces = await db.select().from(marketplacesTable).orderBy(marketplacesTable.name);
  res.json(ListMarketplacesResponse.parse(marketplaces));
});

export default router;
