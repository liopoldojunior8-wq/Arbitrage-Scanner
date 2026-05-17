import { Router, type IRouter } from "express";
import { db, plansTable } from "@workspace/db";
import { ListPlansResponse, GetCurrentSubscriptionResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subscriptions/plans", async (_req, res): Promise<void> => {
  const plans = await db.select().from(plansTable).orderBy(plansTable.price);
  res.json(ListPlansResponse.parse(plans));
});

router.get("/subscriptions/current", async (_req, res): Promise<void> => {
  const subscription = {
    planId: 1,
    planName: "Free",
    status: "active" as const,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
  };
  res.json(GetCurrentSubscriptionResponse.parse(subscription));
});

export default router;
