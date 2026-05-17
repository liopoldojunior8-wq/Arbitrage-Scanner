import { useGetDashboardSummary, useGetDashboardPriceTrend, useGetTopOpportunities } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { TrendingUp, TrendingDown, Target, Activity, DollarSign, Box } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: trend, isLoading: isLoadingTrend } = useGetDashboardPriceTrend({ period: "weekly" });
  const { data: opportunities, isLoading: isLoadingOpps } = useGetTopOpportunities({ limit: 5 });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market Overview</h1>
        <p className="text-muted-foreground mt-2">Real-time arbitrage scanner telemetry.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Opportunities</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatNumber(summary?.activeOpportunities || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-chart-1 flex items-center inline-flex">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Tracking across {summary?.marketsMonitored} markets
                    </span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Potential Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-chart-1">{formatCurrency(summary?.totalPotentialProfit || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className={(summary?.profitChange24h || 0) >= 0 ? "text-chart-1" : "text-chart-2"}>
                      {(summary?.profitChange24h || 0) >= 0 ? "+" : ""}{formatPercent(summary?.profitChange24h || 0)}
                    </span>
                    {" "}from yesterday
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average ROI</CardTitle>
              <Activity className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatPercent(summary?.averageRoi || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Highest: <span className="text-chart-1 font-medium">{formatCurrency(summary?.bestOpportunityProfit || 0)}</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Products Monitored</CardTitle>
              <Box className="h-4 w-4 text-chart-5" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatNumber(summary?.totalProducts || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary?.alertsFired} alerts triggered today
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
        <Card className="md:col-span-4 bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>Arbitrage Opportunity Volume</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoadingTrend ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="colorOpps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
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

        <Card className="md:col-span-3 bg-card/50 backdrop-blur border-border/50 overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle>Top Live Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {isLoadingOpps ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {opportunities?.map((opp) => (
                  <div key={opp.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                        <img src={opp.productImage} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{opp.productName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="uppercase text-xs">{opp.buyMarketplace}</span>
                          <span>→</span>
                          <span className="uppercase text-xs">{opp.sellMarketplace}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-sm font-bold text-chart-1">+{formatCurrency(opp.netProfit)}</div>
                      <div className="text-xs text-muted-foreground">{formatPercent(opp.roi)} ROI</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
