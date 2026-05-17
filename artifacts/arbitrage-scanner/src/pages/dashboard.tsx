import { useMemo } from "react";
import { useGetDashboardPriceTrend } from "@workspace/api-client-react";
import { useLiveDashboard } from "@/hooks/use-live-opportunities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { TrendingUp, TrendingDown, Target, Activity, DollarSign, Box, ArrowRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Link } from "wouter";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const { summary: { data: summary, isLoading: isLoadingSummary }, topOpps: { data: opportunities, isLoading: isLoadingOpps } } = useLiveDashboard();
  const { data: trendRaw, isLoading: isLoadingTrend } = useGetDashboardPriceTrend({ period: "weekly" });

  const trend = useMemo(() => trendRaw ?? [], [trendRaw]);

  const kpis = useMemo(() => [
    {
      label: "Active Opportunities",
      value: formatNumber(summary?.activeOpportunities || 0),
      sub: `Tracking across ${summary?.marketsMonitored ?? 0} markets`,
      subColor: "text-chart-1",
      icon: Target,
      iconColor: "text-primary",
      trend: null,
    },
    {
      label: "Potential Profit",
      value: formatCurrency(summary?.totalPotentialProfit || 0),
      valueColor: "text-chart-1",
      sub: `${(summary?.profitChange24h || 0) >= 0 ? "+" : ""}${formatPercent(summary?.profitChange24h || 0)} from yesterday`,
      subColor: (summary?.profitChange24h || 0) >= 0 ? "text-chart-1" : "text-destructive",
      icon: DollarSign,
      iconColor: "text-chart-1",
    },
    {
      label: "Average ROI",
      value: formatPercent(summary?.averageRoi || 0),
      sub: `Highest: ${formatCurrency(summary?.bestOpportunityProfit || 0)}`,
      subColor: "text-chart-1",
      icon: Activity,
      iconColor: "text-chart-4",
    },
    {
      label: "Products Monitored",
      value: formatNumber(summary?.totalProducts || 0),
      sub: `${summary?.alertsFired ?? 0} alerts triggered today`,
      subColor: "text-muted-foreground",
      icon: Box,
      iconColor: "text-chart-5",
    },
  ], [summary]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Market Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Real-time arbitrage scanner telemetry.</p>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
      >
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={item}>
            <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">{kpi.label}</CardTitle>
                <kpi.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${kpi.iconColor} shrink-0`} />
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                {isLoadingSummary ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <>
                    <div className={`text-xl md:text-2xl font-bold ${(kpi as { valueColor?: string }).valueColor ?? ""}`}>
                      {kpi.value}
                    </div>
                    <p className={`text-xs mt-0.5 ${kpi.subColor}`}>{kpi.sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Chart + Opportunities */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Volume chart */}
        <Card className="lg:col-span-4 bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Arbitrage Opportunity Volume</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 pr-2">
            {isLoadingTrend ? (
              <Skeleton className="h-48 md:h-72 w-full" />
            ) : (
              <div className="h-48 md:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ left: -10 }}>
                    <defs>
                      <linearGradient id="colorOpps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="opportunities"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOpps)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top opportunities */}
        <Card className="lg:col-span-3 bg-card/50 backdrop-blur border-border/50 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Top Live Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto px-3 md:px-6">
            {isLoadingOpps ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {opportunities?.map((opp) => (
                  <Link key={opp.id} href="/opportunities">
                    <div className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                        <div className="h-9 w-9 md:h-10 md:w-10 rounded bg-muted shrink-0 overflow-hidden">
                          <img
                            src={opp.productImage}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="truncate min-w-0">
                          <p className="text-xs md:text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {opp.productName}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <span className="uppercase">{opp.buyMarketplace}</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                            <span className="uppercase">{opp.sellMarketplace}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs md:text-sm font-bold text-chart-1">
                          +{formatCurrency(opp.netProfit)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatPercent(opp.roi)} ROI
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
