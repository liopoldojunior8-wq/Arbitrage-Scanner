import { Router, type IRouter } from "express";
import { db, opportunitiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod";

const router: IRouter = Router();

const CalculatorInputSchema = z.object({
  budget: z.number().min(1),
  roiPreference: z.enum(["conservative", "balanced", "aggressive"]),
  monthlyTurns: z.number().int().min(1).max(30).default(4),
  minProfit: z.number().min(0).default(0),
});

function getRiskLevel(roi: number, profitPercent: number): "low" | "medium" | "high" {
  if (roi < 30 && profitPercent < 25) return "low";
  if (roi < 80 && profitPercent < 60) return "medium";
  return "high";
}

function getCapitalEfficiency(netProfit: number, buyPrice: number): number {
  return buyPrice > 0 ? (netProfit / buyPrice) * 100 : 0;
}

router.post("/calculator/analyze", async (req, res): Promise<void> => {
  const parsed = CalculatorInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { budget, roiPreference, monthlyTurns, minProfit } = parsed.data;

  // Fetch all active opportunities
  const opportunities = await db
    .select()
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.status, "active"));

  // Score and filter based on preference
  const scored = opportunities
    .filter((o) => o.netProfit >= minProfit)
    .map((o) => {
      const canAfford = o.buyPrice <= budget;
      const capitalEfficiency = getCapitalEfficiency(o.netProfit, o.buyPrice);
      const riskLevel = getRiskLevel(o.roi, o.profitPercent);
      const projectedMonthlyProfit = canAfford ? o.netProfit * monthlyTurns : 0;

      // Score based on preference
      let score = 0;
      if (roiPreference === "conservative") {
        // Prefer low risk, decent ROI, affordable
        score =
          (riskLevel === "low" ? 100 : riskLevel === "medium" ? 40 : 0) +
          (canAfford ? 60 : 0) +
          o.roi * 0.3;
      } else if (roiPreference === "balanced") {
        // Balance ROI with risk
        score = capitalEfficiency * 0.5 + o.roi * 0.3 + (canAfford ? 40 : 0);
      } else {
        // Aggressive: maximize ROI and capital efficiency regardless of risk
        score = o.roi * 0.6 + capitalEfficiency * 0.4;
      }

      return {
        id: o.id,
        productName: o.productName,
        productImage: o.productImage,
        buyMarketplace: o.buyMarketplace,
        sellMarketplace: o.sellMarketplace,
        buyPrice: o.buyPrice,
        sellPrice: o.sellPrice,
        grossProfit: o.grossProfit,
        netProfit: o.netProfit,
        roi: o.roi,
        estimatedFees: o.estimatedFees,
        estimatedShipping: o.estimatedShipping,
        profitPercent: o.profitPercent,
        capitalEfficiency,
        riskLevel,
        canAfford,
        projectedMonthlyProfit,
        _score: score,
      };
    })
    .sort((a, b) => b._score - a._score);

  const ranked = scored.map(({ _score, ...rest }) => rest);
  const affordable = ranked.filter((o) => o.canAfford);

  const summary = {
    totalBudgetUsed: affordable[0]?.buyPrice ?? 0,
    projectedMonthlyProfit: affordable.length > 0
      ? affordable.slice(0, 3).reduce((sum, o) => sum + o.projectedMonthlyProfit, 0) / Math.min(3, affordable.length)
      : 0,
    projectedAnnualProfit: affordable.length > 0
      ? affordable[0].projectedMonthlyProfit * 12
      : 0,
    avgRoi: affordable.length > 0
      ? affordable.reduce((s, o) => s + o.roi, 0) / affordable.length
      : 0,
    avgCapitalEfficiency: affordable.length > 0
      ? affordable.reduce((s, o) => s + o.capitalEfficiency, 0) / affordable.length
      : 0,
    bestOpportunityId: ranked[0]?.id ?? null,
    opportunitiesAffordable: affordable.length,
  };

  // Generate AI suggestion
  let aiSuggestion = "";
  try {
    const top3 = affordable.slice(0, 3);
    const oppSummary = top3.map((o, i) =>
      `${i + 1}. ${o.productName} (${o.buyMarketplace}→${o.sellMarketplace}): buy at $${o.buyPrice.toFixed(2)}, net profit $${o.netProfit.toFixed(2)}, ROI ${o.roi.toFixed(1)}%, risk: ${o.riskLevel}`
    ).join("\n");

    const prompt = `You are an expert e-commerce arbitrage advisor. A user has a budget of $${budget} and prefers a "${roiPreference}" strategy (${monthlyTurns} turns/month).

Here are their top affordable opportunities:
${oppSummary || "No opportunities within budget."}

Write a concise, actionable 2-3 sentence recommendation. Include: which opportunity to start with and why, what monthly profit they can realistically expect, and one specific tip for their strategy. Be direct and numbers-focused. No markdown.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    aiSuggestion = completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    req.log?.warn({ err }, "AI suggestion failed, using fallback");
    const best = affordable[0];
    if (best) {
      aiSuggestion = `With a $${budget.toFixed(0)} budget and a ${roiPreference} approach, your best starting opportunity is ${best.productName} with ${best.roi.toFixed(1)}% ROI and $${best.netProfit.toFixed(2)} net profit per flip. At ${monthlyTurns} turns per month, you could generate approximately $${best.projectedMonthlyProfit.toFixed(0)}/month from this single opportunity.`;
    } else {
      aiSuggestion = `No active opportunities currently fit your $${budget.toFixed(0)} budget. Try increasing your budget or check back as new opportunities are detected.`;
    }
  }

  res.json({ rankedOpportunities: ranked, summary, aiSuggestion });
});

export default router;
