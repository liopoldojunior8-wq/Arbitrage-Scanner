import { useState, useRef } from "react";
import { useGetOpportunityStats, getGetOpportunityStatsQueryKey } from "@workspace/api-client-react";
import { useLiveOpportunities } from "@/hooks/use-live-opportunities";
import { useRefreshContext } from "@/contexts/refresh-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatPercent } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, TrendingUp, BarChart2, DollarSign, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const statusColors: Record<string, string> = {
  active: "bg-chart-1/20 text-chart-1 border-chart-1/30",
  expired: "bg-muted text-muted-foreground border-border/50",
  captured: "bg-chart-4/20 text-chart-4 border-chart-4/30",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariant = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

export default function Opportunities() {
  const [status, setStatus] = useState<"active" | "expired" | "all">("active");
  const [sortBy, setSortBy] = useState<"profit" | "roi" | "profit_percent">("profit");
  const [page, setPage] = useState(1);
  const { interval } = useRefreshContext();

  const params = { status, sortBy, page, limit: 20 };
  const { data, isLoading, isNew, clearNew } = useLiveOpportunities(params);

  const refetchInterval = interval > 0 ? interval : false;
  const { data: stats } = useGetOpportunityStats({
    query: {
      queryKey: getGetOpportunityStatsQueryKey(),
      refetchInterval: refetchInterval as number | false,
    },
  });

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Arbitrage Opportunities</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Live cross-marketplace arbitrage signals ranked by profitability.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Signals", value: stats?.totalActive ?? 0, format: "num", icon: Zap, color: "text-primary" },
          { label: "Avg Net Profit", value: stats?.avgProfit ?? 0, format: "currency", icon: DollarSign, color: "text-chart-1" },
          { label: "Avg ROI", value: stats?.avgRoi ?? 0, format: "percent", icon: TrendingUp, color: "text-chart-4" },
          { label: "Total Potential", value: stats?.totalPotentialProfit ?? 0, format: "currency", icon: BarChart2, color: "text-chart-5" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border/50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <div className="text-lg md:text-2xl font-bold">
                {stat.format === "currency"
                  ? formatCurrency(stat.value)
                  : stat.format === "percent"
                  ? formatPercent(stat.value)
                  : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar chart */}
      {stats && stats.byBuyMarketplace.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm">Profit by Buy Marketplace</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="h-32 md:h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byBuyMarketplace}>
                  <XAxis
                    dataKey="marketplace"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(v: number) => [formatCurrency(v), "Total Profit"]}
                  />
                  <Bar dataKey="totalProfit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">
          {(["active", "all", "expired"] as const).map((s) => (
            <Button
              key={s}
              data-testid={`button-filter-${s}`}
              variant={status === s ? "default" : "outline"}
              size="sm"
              className="capitalize text-xs h-8"
              onClick={() => { setStatus(s); setPage(1); }}
            >
              {s}
            </Button>
          ))}
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger
            className="w-36 bg-card/50 border-border/50 h-8 text-xs"
            data-testid="select-sort-by"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="profit">Net Profit</SelectItem>
            <SelectItem value="roi">ROI</SelectItem>
            <SelectItem value="profit_percent">Profit %</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Opportunity list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 md:h-24 w-full" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-2 md:space-y-3"
          >
            {data?.items.map((opp) => {
              const _isNew = isNew(opp.id);
              return (
                <motion.div
                  key={opp.id}
                  variants={itemVariant}
                  layout
                  onAnimationComplete={() => {
                    if (_isNew) clearNew(opp.id);
                  }}
                >
                  {/* New opportunity glow ring */}
                  {_isNew && (
                    <motion.div
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.6, 1, 0] }}
                      transition={{ duration: 2.4, times: [0, 0.2, 0.5, 0.8, 1] }}
                    />
                  )}

                  <motion.div
                    animate={
                      _isNew
                        ? {
                            boxShadow: [
                              "0 0 0px hsl(var(--chart-1)/0)",
                              "0 0 24px hsl(var(--chart-1)/0.5)",
                              "0 0 12px hsl(var(--chart-1)/0.3)",
                              "0 0 24px hsl(var(--chart-1)/0.5)",
                              "0 0 0px hsl(var(--chart-1)/0)",
                            ],
                            borderColor: [
                              "hsl(var(--border)/0.5)",
                              "hsl(var(--chart-1)/0.8)",
                              "hsl(var(--chart-1)/0.5)",
                              "hsl(var(--chart-1)/0.8)",
                              "hsl(var(--border)/0.5)",
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 2.4 }}
                    className={`rounded-xl border bg-card/50 border-border/50 transition-colors ${
                      opp.status === "active"
                        ? "hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.07)]"
                        : ""
                    }`}
                    data-testid={`card-opportunity-${opp.id}`}
                  >
                    <div className="p-3 md:p-4">
                      {/* Mobile layout */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          {opp.productImage && (
                            <img
                              src={opp.productImage}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {_isNew && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-[10px] font-bold text-chart-1 bg-chart-1/10 border border-chart-1/30 rounded px-1.5 py-0.5"
                              >
                                NEW
                              </motion.span>
                            )}
                            <span className="font-semibold text-sm truncate">
                              {opp.productName}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 ${statusColors[opp.status]}`}
                            >
                              {opp.status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-[10px] border-border/40 text-muted-foreground shrink-0 hidden sm:inline-flex"
                            >
                              {opp.category}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <span className="capitalize font-medium">{opp.buyMarketplace}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="capitalize font-medium">{opp.sellMarketplace}</span>
                            <span className="hidden sm:inline">·</span>
                            <span className="hidden sm:inline">
                              {formatCurrency(opp.buyPrice)} → {formatCurrency(opp.sellPrice)}
                            </span>
                          </div>

                          {/* Mobile profit row */}
                          <div className="flex items-center gap-3 mt-2 md:hidden">
                            <span className="text-xs text-muted-foreground">
                              -{formatCurrency(opp.estimatedFees + opp.estimatedShipping)} fees
                            </span>
                            <span className="font-bold text-chart-1 text-sm">
                              +{formatCurrency(opp.netProfit)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatPercent(opp.roi)} ROI
                            </span>
                          </div>
                        </div>

                        {/* Desktop profit columns */}
                        <div className="hidden md:flex items-center gap-5 shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Gross</div>
                            <div className="font-semibold text-sm">
                              {formatCurrency(opp.grossProfit)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Fees+Ship</div>
                            <div className="font-semibold text-sm text-destructive/80">
                              -{formatCurrency(opp.estimatedFees + opp.estimatedShipping)}
                            </div>
                          </div>
                          <div className="text-right border-l border-border/50 pl-5">
                            <div className="text-xs text-muted-foreground">Net Profit</div>
                            <div
                              className="text-lg font-bold text-chart-1"
                              data-testid={`text-profit-${opp.id}`}
                            >
                              +{formatCurrency(opp.netProfit)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatPercent(opp.roi)} ROI
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground self-center">{data.total} total</span>
          <Button
            variant="outline"
            size="sm"
            disabled={data.items.length < 20}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {!isLoading && (!data?.items || data.items.length === 0) && (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No opportunities found</p>
          <p className="text-sm mt-1">Try changing the status filter or check back soon.</p>
        </div>
      )}
    </div>
  );
}
