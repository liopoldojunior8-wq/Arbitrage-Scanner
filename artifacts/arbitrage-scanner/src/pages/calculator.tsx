import { useState } from "react";
import { useAnalyzeCalculator } from "@workspace/api-client-react";
import type { CalculatorRankedOpportunity, CalculatorResult } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Calculator,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Loader2,
  Percent,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROI_OPTIONS = [
  {
    value: "conservative" as const,
    label: "Conservative",
    description: "Lower risk, steady returns",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    activeBg: "bg-emerald-500/20 border-emerald-500 ring-1 ring-emerald-500/50",
    icon: ShieldCheck,
  },
  {
    value: "balanced" as const,
    label: "Balanced",
    description: "Mix of risk and reward",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/30",
    activeBg: "bg-sky-500/20 border-sky-500 ring-1 ring-sky-500/50",
    icon: ShieldQuestion,
  },
  {
    value: "aggressive" as const,
    label: "Aggressive",
    description: "High ROI, higher risk",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/30",
    activeBg: "bg-rose-500/20 border-rose-500 ring-1 ring-rose-500/50",
    icon: ShieldAlert,
  },
];

const RISK_CONFIG = {
  low: { label: "Low Risk", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  medium: { label: "Med Risk", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  high: { label: "High Risk", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
};

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function OpportunityRow({ opp, rank }: { opp: CalculatorRankedOpportunity; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const risk = RISK_CONFIG[opp.riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        "rounded-xl border overflow-hidden transition-colors",
        opp.canAfford
          ? "border-border/60 bg-card/80"
          : "border-border/30 bg-card/30 opacity-60"
      )}
    >
      <button
        className="w-full text-left p-4 flex items-center gap-3"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Rank */}
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
            rank === 0
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              : rank === 1
              ? "bg-slate-400/10 text-slate-400 border border-slate-500/30"
              : "bg-border/50 text-muted-foreground border border-border/30"
          )}
        >
          {rank + 1}
        </div>

        {/* Product image / placeholder */}
        <div className="w-9 h-9 rounded-lg bg-muted/60 border border-border/40 shrink-0 overflow-hidden flex items-center justify-center">
          {opp.productImage ? (
            <img src={opp.productImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-muted-foreground font-bold">IMG</span>
          )}
        </div>

        {/* Name & route */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{opp.productName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {opp.buyMarketplace} <ArrowRight className="inline h-2.5 w-2.5 mx-0.5" /> {opp.sellMarketplace}
          </p>
        </div>

        {/* Key metrics */}
        <div className="hidden sm:flex items-center gap-4 mr-2 shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Net profit</p>
            <p className="text-sm font-semibold text-emerald-400">${fmt(opp.netProfit)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">ROI</p>
            <p className="text-sm font-semibold text-primary">{fmt(opp.roi, 1)}%</p>
          </div>
          <Badge variant="outline" className={cn("text-xs border", risk.color)}>
            {risk.label}
          </Badge>
        </div>

        {/* Expand toggle */}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Separator className="border-border/40" />
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
              <Stat label="Buy price" value={`$${fmt(opp.buyPrice)}`} />
              <Stat label="Sell price" value={`$${fmt(opp.sellPrice)}`} />
              <Stat label="Gross profit" value={`$${fmt(opp.grossProfit)}`} />
              <Stat label="Net profit" value={`$${fmt(opp.netProfit)}`} color="text-emerald-400" />
              <Stat label="Estimated fees" value={`$${fmt(opp.estimatedFees)}`} />
              <Stat label="Est. shipping" value={`$${fmt(opp.estimatedShipping)}`} />
              <Stat label="ROI" value={`${fmt(opp.roi, 1)}%`} color="text-primary" />
              <Stat label="Profit %" value={`${fmt(opp.profitPercent, 1)}%`} />
              <Stat
                label="Capital efficiency"
                value={`${fmt(opp.capitalEfficiency, 1)}%`}
                color="text-sky-400"
              />
              <Stat
                label="Monthly profit"
                value={`$${fmt(opp.projectedMonthlyProfit)}`}
                color={opp.canAfford ? "text-emerald-400" : "text-muted-foreground"}
              />
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground mb-1">Affordability</p>
                <Badge
                  variant="outline"
                  className={
                    opp.canAfford
                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                  }
                >
                  {opp.canAfford ? "Within budget" : "Over budget"}
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("font-semibold", color ?? "text-foreground")}>{value}</p>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="bg-card/80 border-border/50">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn("rounded-lg p-2 mt-0.5", color ?? "bg-primary/10")}>
          <Icon className={cn("h-4 w-4", color ? "text-foreground" : "text-primary")} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CalculatorPage() {
  const [budget, setBudget] = useState(500);
  const [roiPreference, setRoiPreference] = useState<"conservative" | "balanced" | "aggressive">(
    "balanced"
  );
  const [monthlyTurns, setMonthlyTurns] = useState(4);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  const { mutate, isPending } = useAnalyzeCalculator({
    mutation: {
      onSuccess: (data) => setResult(data),
    },
  });

  const handleAnalyze = () => {
    mutate({ data: { budget, roiPreference, monthlyTurns } });
  };

  const budgetMin = 50;
  const budgetMax = 10000;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          Profit Calculator
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Set your budget and strategy — AI will rank the best opportunities and estimate your returns.
        </p>
      </div>

      {/* Controls */}
      <Card className="bg-card/80 border-border/50">
        <CardContent className="p-6 space-y-6">
          {/* Budget slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary" />
                Available Budget
              </Label>
              <span className="text-xl font-bold text-primary tabular-nums">
                ${budget.toLocaleString()}
              </span>
            </div>
            <Slider
              min={budgetMin}
              max={budgetMax}
              step={50}
              value={[budget]}
              onValueChange={([v]) => setBudget(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${budgetMin}</span>
              <span>${(budgetMax / 2).toLocaleString()}</span>
              <span>${budgetMax.toLocaleString()}</span>
            </div>
          </div>

          {/* Strategy */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Strategy
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ROI_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = roiPreference === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setRoiPreference(opt.value)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all duration-150",
                      isActive ? opt.activeBg : opt.bg
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn("h-4 w-4", opt.color)} />
                      <span className={cn("text-sm font-semibold", opt.color)}>{opt.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly turns */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" />
                Monthly Turns
              </Label>
              <span className="text-base font-bold text-foreground tabular-nums">
                {monthlyTurns}× / month
              </span>
            </div>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[monthlyTurns]}
              onValueChange={([v]) => setMonthlyTurns(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1×</span>
              <span>10×</span>
              <span>20×</span>
            </div>
          </div>

          {/* Analyze button */}
          <Button
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
            onClick={handleAnalyze}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing with AI…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze My Budget
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Summary cards */}
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Projected Returns
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SummaryCard
                  icon={DollarSign}
                  label="Monthly profit"
                  value={`$${fmt(result.summary.projectedMonthlyProfit)}`}
                  sub={`×${monthlyTurns} turns`}
                  color="bg-emerald-500/10"
                />
                <SummaryCard
                  icon={TrendingUp}
                  label="Annual profit"
                  value={`$${fmt(result.summary.projectedAnnualProfit)}`}
                  sub="Projected"
                  color="bg-primary/10"
                />
                <SummaryCard
                  icon={Percent}
                  label="Avg ROI"
                  value={`${fmt(result.summary.avgRoi, 1)}%`}
                  sub="Affordable opps"
                  color="bg-sky-500/10"
                />
                <SummaryCard
                  icon={Zap}
                  label="Within budget"
                  value={`${result.summary.opportunitiesAffordable}`}
                  sub="Opportunities"
                  color="bg-amber-500/10"
                />
              </div>
            </div>

            {/* AI suggestion */}
            <Card className="bg-gradient-to-br from-primary/10 via-card/80 to-card/80 border-primary/30">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
                  <Bot className="h-4 w-4" />
                  AI Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-foreground/90 leading-relaxed">{result.aiSuggestion}</p>
              </CardContent>
            </Card>

            {/* Ranked opportunities */}
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Ranked Opportunities
                <Badge variant="outline" className="ml-auto text-xs text-muted-foreground border-border/50">
                  {result.rankedOpportunities.length} found
                </Badge>
              </h2>

              {result.rankedOpportunities.length === 0 ? (
                <Card className="bg-card/60 border-border/40">
                  <CardContent className="p-8 text-center text-muted-foreground text-sm">
                    No opportunities found. Try adjusting your filters or check back once new deals are detected.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {result.rankedOpportunities.map((opp, i) => (
                    <OpportunityRow key={opp.id} opp={opp} rank={i} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
