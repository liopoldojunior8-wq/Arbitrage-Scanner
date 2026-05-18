import { Router, type IRouter } from "express";
import { db, paymentInfoTable } from "@workspace/db";

const router: IRouter = Router();

// GET /payment/info — return the single payment info row (upserted on demand)
router.get("/payment/info", async (req, res): Promise<void> => {
  const rows = await db.select().from(paymentInfoTable).limit(1);

  if (rows.length > 0) {
    res.json(rows[0]);
    return;
  }

  // Auto-create a blank row on first access
  const inserted = await db
    .insert(paymentInfoTable)
    .values({})
    .returning();

  res.json(inserted[0]);
});

// PUT /payment/info — update (or create) the single payment info row
router.put("/payment/info", async (req, res): Promise<void> => {
  const {
    accountHolderName,
    paypalEmail,
    mpesaNumber,
    bankName,
    bankAccountNumber,
    bankRoutingNumber,
    bankSwiftCode,
    paymentInstructions,
  } = req.body as Record<string, string>;

  const rows = await db.select().from(paymentInfoTable).limit(1);

  if (rows.length > 0) {
    const updated = await db
      .update(paymentInfoTable)
      .set({
        accountHolderName: accountHolderName ?? rows[0].accountHolderName,
        paypalEmail: paypalEmail ?? rows[0].paypalEmail,
        mpesaNumber: mpesaNumber ?? rows[0].mpesaNumber,
        bankName: bankName ?? rows[0].bankName,
        bankAccountNumber: bankAccountNumber ?? rows[0].bankAccountNumber,
        bankRoutingNumber: bankRoutingNumber ?? rows[0].bankRoutingNumber,
        bankSwiftCode: bankSwiftCode ?? rows[0].bankSwiftCode,
        paymentInstructions: paymentInstructions ?? rows[0].paymentInstructions,
        updatedAt: new Date(),
      })
      .returning();
    res.json(updated[0]);
  } else {
    const inserted = await db
      .insert(paymentInfoTable)
      .values({
        accountHolderName: accountHolderName ?? "",
        paypalEmail: paypalEmail ?? "",
        mpesaNumber: mpesaNumber ?? "",
        bankName: bankName ?? "",
        bankAccountNumber: bankAccountNumber ?? "",
        bankRoutingNumber: bankRoutingNumber ?? "",
        bankSwiftCode: bankSwiftCode ?? "",
        paymentInstructions: paymentInstructions ?? "",
      })
      .returning();
    res.json(inserted[0]);
  }
});

export default router;
