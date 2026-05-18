import { Router, type IRouter } from "express";
import { db, usersTable, transactionsTable, plansTable } from "@workspace/db";
import { eq, desc, sql, and, ilike } from "drizzle-orm";
import { signToken, requireAdmin } from "../middlewares/admin-auth";

const router: IRouter = Router();

// ── Auth ──────────────────────────────────────────────────────────────────────

router.post("/admin/login", async (req, res): Promise<void> => {
  const { password } = req.body as { password?: string };
  const adminPwd = process.env["ADMIN_PASSWORD"];

  if (!adminPwd || password !== adminPwd) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const secret = process.env["SESSION_SECRET"] ?? "dev-secret";
  const token = signToken(password, secret);
  res.json({ token });
});

// All routes below require admin token
router.use("/admin", requireAdmin);

// ── Stats ─────────────────────────────────────────────────────────────────────

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [userStats] = await db
    .select({
      totalUsers: sql<number>`count(*)::int`,
      activeUsers: sql<number>`count(*) filter (where status = 'active')::int`,
      suspendedUsers: sql<number>`count(*) filter (where status = 'suspended')::int`,
    })
    .from(usersTable);

  const [txStats] = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(amount) filter (where status = 'confirmed'), 0)::float`,
      pendingRevenue: sql<number>`coalesce(sum(amount) filter (where status = 'pending'), 0)::float`,
      totalTransactions: sql<number>`count(*)::int`,
      pendingTransactions: sql<number>`count(*) filter (where status = 'pending')::int`,
      confirmedTransactions: sql<number>`count(*) filter (where status = 'confirmed')::int`,
    })
    .from(transactionsTable);

  const usersByPlan = await db
    .select({
      planName: plansTable.name,
      count: sql<number>`count(*)::int`,
    })
    .from(usersTable)
    .leftJoin(plansTable, eq(usersTable.planId, plansTable.id))
    .groupBy(plansTable.name)
    .orderBy(desc(sql`count(*)`));

  res.json({
    totalUsers: userStats?.totalUsers ?? 0,
    activeUsers: userStats?.activeUsers ?? 0,
    suspendedUsers: userStats?.suspendedUsers ?? 0,
    totalRevenue: txStats?.totalRevenue ?? 0,
    pendingRevenue: txStats?.pendingRevenue ?? 0,
    totalTransactions: txStats?.totalTransactions ?? 0,
    pendingTransactions: txStats?.pendingTransactions ?? 0,
    confirmedTransactions: txStats?.confirmedTransactions ?? 0,
    usersByPlan: usersByPlan.map((r) => ({ planName: r.planName ?? "No Plan", count: r.count })),
  });
});

// ── Users ─────────────────────────────────────────────────────────────────────

router.get("/admin/users", async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
  const status = req.query["status"] as string | undefined;
  const offset = (page - 1) * limit;

  const where = status ? eq(usersTable.status, status) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        phone: usersTable.phone,
        status: usersTable.status,
        planId: usersTable.planId,
        planName: plansTable.name,
        premiumUntil: usersTable.premiumUntil,
        notes: usersTable.notes,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .leftJoin(plansTable, eq(usersTable.planId, plansTable.id))
      .where(where)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(where),
  ]);

  res.json({
    items: items.map((u) => ({
      ...u,
      premiumUntil: u.premiumUntil?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    })),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

router.post("/admin/users", async (req, res): Promise<void> => {
  const { email, name, phone, status, planId, premiumUntil, notes } = req.body as Record<string, unknown>;

  const [created] = await db
    .insert(usersTable)
    .values({
      email: String(email ?? ""),
      name: String(name ?? ""),
      phone: String(phone ?? ""),
      status: String(status ?? "active"),
      planId: planId ? Number(planId) : null,
      premiumUntil: premiumUntil ? new Date(String(premiumUntil)) : null,
      notes: String(notes ?? ""),
    })
    .returning();

  const planRow = created.planId
    ? (await db.select().from(plansTable).where(eq(plansTable.id, created.planId)))[0]
    : null;

  res.status(201).json({
    ...created,
    planName: planRow?.name ?? null,
    premiumUntil: created.premiumUntil?.toISOString() ?? null,
    createdAt: created.createdAt.toISOString(),
  });
});

router.put("/admin/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] ?? "0", 10);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { email, name, phone, status, planId, premiumUntil, notes } = req.body as Record<string, unknown>;

  const [updated] = await db
    .update(usersTable)
    .set({
      ...(email !== undefined && { email: String(email) }),
      ...(name !== undefined && { name: String(name) }),
      ...(phone !== undefined && { phone: String(phone) }),
      ...(status !== undefined && { status: String(status) }),
      ...(planId !== undefined && { planId: planId ? Number(planId) : null }),
      ...(premiumUntil !== undefined && { premiumUntil: premiumUntil ? new Date(String(premiumUntil)) : null }),
      ...(notes !== undefined && { notes: String(notes) }),
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "User not found" }); return; }

  const planRow = updated.planId
    ? (await db.select().from(plansTable).where(eq(plansTable.id, updated.planId)))[0]
    : null;

  res.json({
    ...updated,
    planName: planRow?.name ?? null,
    premiumUntil: updated.premiumUntil?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/admin/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] ?? "0", 10);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).end();
});

// ── Transactions ──────────────────────────────────────────────────────────────

router.get("/admin/transactions", async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.min(100, parseInt(req.query["limit"] as string) || 20);
  const status = req.query["status"] as string | undefined;
  const offset = (page - 1) * limit;

  const where = status ? eq(transactionsTable.status, status) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(transactionsTable)
      .where(where)
      .orderBy(desc(transactionsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactionsTable)
      .where(where),
  ]);

  res.json({
    items: items.map((t) => ({
      ...t,
      confirmedAt: t.confirmedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

router.post("/admin/transactions", async (req, res): Promise<void> => {
  const { userId, userEmail, userName, amount, currency, method, planId, planName, reference, notes } =
    req.body as Record<string, unknown>;

  const [created] = await db
    .insert(transactionsTable)
    .values({
      userId: userId ? Number(userId) : null,
      userEmail: String(userEmail ?? ""),
      userName: String(userName ?? ""),
      amount: Number(amount ?? 0),
      currency: String(currency ?? "USD"),
      method: String(method ?? "paypal"),
      status: "pending",
      planId: planId ? Number(planId) : null,
      planName: String(planName ?? ""),
      reference: String(reference ?? ""),
      notes: String(notes ?? ""),
    })
    .returning();

  res.status(201).json({
    ...created,
    confirmedAt: null,
    createdAt: created.createdAt.toISOString(),
  });
});

router.put("/admin/transactions/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] ?? "0", 10);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { status, reference, notes } = req.body as Record<string, unknown>;

  const isConfirming = status === "confirmed";

  const [updated] = await db
    .update(transactionsTable)
    .set({
      ...(status !== undefined && { status: String(status) }),
      ...(reference !== undefined && { reference: String(reference) }),
      ...(notes !== undefined && { notes: String(notes) }),
      ...(isConfirming && { confirmedAt: new Date() }),
      updatedAt: new Date(),
    })
    .where(eq(transactionsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Transaction not found" }); return; }

  res.json({
    ...updated,
    confirmedAt: updated.confirmedAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
