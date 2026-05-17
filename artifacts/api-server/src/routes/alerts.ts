import { Router, type IRouter } from "express";
import { db, alertsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListAlertsQueryParams,
  ListAlertsResponse,
  CreateAlertBody,
  UpdateAlertParams,
  UpdateAlertBody,
  UpdateAlertResponse,
  DeleteAlertParams,
} from "@workspace/api-zod";
import { db as dbImport, productsTable } from "@workspace/db";

const router: IRouter = Router();

function mapAlert(a: typeof alertsTable.$inferSelect) {
  return {
    ...a,
    triggeredAt: a.triggeredAt ? a.triggeredAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/alerts", async (req, res): Promise<void> => {
  const params = ListAlertsQueryParams.safeParse(req.query);
  const { active } = params.success ? params.data : {};

  const conditions = [];
  if (active !== undefined) {
    conditions.push(eq(alertsTable.isActive, active));
  }

  const alerts = await db
    .select()
    .from(alertsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(alertsTable.createdAt);

  res.json(ListAlertsResponse.parse(alerts.map(mapAlert)));
});

router.post("/alerts", async (req, res): Promise<void> => {
  const parsed = CreateAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.productId));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [alert] = await db
    .insert(alertsTable)
    .values({
      productId: parsed.data.productId,
      productName: product.name,
      marketplace: product.marketplace,
      targetPrice: parsed.data.targetPrice,
      currentPrice: product.currentPrice,
      condition: parsed.data.condition,
      channels: parsed.data.channels ?? [],
    })
    .returning();

  res.status(201).json(mapAlert(alert));
});

router.patch("/alerts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = UpdateAlertParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid alert ID" });
    return;
  }

  const body = UpdateAlertBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (body.data.targetPrice !== undefined) updates.targetPrice = body.data.targetPrice;
  if (body.data.condition !== undefined) updates.condition = body.data.condition;
  if (body.data.isActive !== undefined) updates.isActive = body.data.isActive;
  if (body.data.channels !== undefined) updates.channels = body.data.channels;

  const [alert] = await db
    .update(alertsTable)
    .set(updates)
    .where(eq(alertsTable.id, paramsResult.data.id))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  res.json(UpdateAlertResponse.parse(mapAlert(alert)));
});

router.delete("/alerts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAlertParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid alert ID" });
    return;
  }

  const [alert] = await db
    .delete(alertsTable)
    .where(eq(alertsTable.id, params.data.id))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
