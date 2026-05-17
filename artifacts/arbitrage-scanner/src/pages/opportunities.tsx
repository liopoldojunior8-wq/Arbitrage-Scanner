import { useState } from "react";
import { useListOpportunities, useGetOpportunityStats, getListOpportunitiesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatPercent } from "@/lib/format";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, BarChart2, DollarSign, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const statusColors: Record<string, string> = {
  active: "bg-chart-1/20 text-chart-1 border-chart-1/30",
  expired: "bg-muted text-muted-foreground border-border/50",
  captured: "bg-chart-4/20 text-chart-4 border-chart-4/30",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

export default function Opportunities() {
  const [status, setStatus] = useState<"active" | "expired" | "all">("active");
  const [sortBy, setSortBy] = useState<"profit" | "roi" | "profit_percent">("profit");
  const [page, setPage] = useState(1);

  const params = { status, sortBy, page, limit: 20 };
  const { data, isLoading } = useListOpportunities(params, { query: { queryKey: getListOpportunitiesQueryKey(params) } });
  const { data: stats } = useGetOpportunityStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Arbitrage Opportunities</h1>
        <p className="text-muted-foreground mt-1">Live cross-marketplace arbitrage signals ranked by profitability.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Active Signals", value: stats?.totalActive ?? 0, format: "num", icon: Zap, color: "text-primary" },
          { label: "Avg Net Profit", value: stats?.avgProfit ?? 0, format: "currency", icon: DollarSign, color: "text-chart-1" },
          { label: "Avg ROI", value: stats?.avgRoi ?? 0, format: "percent", icon: TrendingUp, color: "text-chart-4" },
          { label: "Total Potential", value: stats?.totalPotentialProfit ?? 0, format: "currency", icon: BarChart2, color: "text-chart-5" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold">
                {stat.format === "currency" ? formatCurrency(stat.value) :
                 stat.format === "percent" ? formatPercent(stat.value) :
                 stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && stats.byBuyMarketplace.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm">Profit by Buy Marketplace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byBuyMarketplace}>
                  <XAxis dataKey="marketplace" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                    formatter={(v: number) => [formatCurrency(v), "Total Profit"]}
                  />
                  <Bar dataKey="totalProfit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(["active", "all", "expired"] as const).map((s) => (
            <Button
              key={s}
              data-testid={`button-filter-${s}`}
              variant={status === s ? "default" : "outline"}
              size="sm"
              className="capitalize"
              onClick={() => { setStatus(s); setPage(1); }}
            >
              {s}
            </Button>
          ))}
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-40 bg-card/50 border-border/50" data-testid="select-sort-by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="profit">Net Profit</SelectItem>
            <SelectItem value="roi">ROI</SelectItem>
            <SelectItem value="profit_percent">Profit %</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {data?.items.map((opp) => (
            <motion.div key={opp.id} variants={item}>
              <Card
                data-testid={`card-opportunity-${opp.id}`}
                className={`bg-card/50 border-border/50 hover:border-primary/30 transition-all ${opp.status === "active" ? "hover:shadow-[0_0_20px_hsl(var(--primary)/0.08)]" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {opp.productImage && <img src={opp.productImage} alt="" className="h-full w-full object-cover" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{opp.productName}</span>
                        <Badge variant="outline" className={`text-xs shrink-0 ${statusColors[opp.status]}`}>
                          {opp.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground shrink-0">{opp.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span className="capitalize font-medium">{opp.buyMarketplace}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span className="capitalize font-medium">{opp.sellMarketplace}</span>
                        <span className="text-xs">·</span>
                        <span className="text-xs">{formatCurrency(opp.buyPrice)} → {formatCurrency(opp.sellPrice)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Gross</div>
                        <div className="font-semibold">{formatCurrency(opp.grossProfit)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Fees+Ship</div>
                        <div className="font-semibold text-destructive/80">-{formatCurrency(opp.estimatedFees + opp.estimatedShipping)}</div>
                      </div>
                      <div className="text-right border-l border-border/50 pl-6">
                        <div className="text-xs text-muted-foreground">Net Profit</div>
                        <div className="text-xl font-bold text-chart-1" data-testid={`text-profit-${opp.id}`}>
                          +{formatCurrency(opp.netProfit)}
                        </div>
                        <div className="text-xs text-muted-foreground">{formatPercent(opp.roi)} ROI</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">{data.total} total</span>
          <Button variant="outline" size="sm" disabled={data.items.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {!isLoading && (!data?.items || data.items.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No opportunities found</p>
          <p className="text-sm mt-1">Try changing the status filter or check back soon.</p>
        </div>
      )}
    </div>
  );
}
