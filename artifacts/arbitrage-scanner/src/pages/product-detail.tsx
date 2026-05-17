import { useParams, Link } from "wouter";
import {
  useGetProduct,
  useGetProductPriceHistory,
  useListOpportunities,
  useListAlerts,
  useCreateAlert,
  useDeleteAlert,
  getGetProductQueryKey,
  getGetProductPriceHistoryQueryKey,
  getListOpportunitiesQueryKey,
  getListAlertsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { ArrowLeft, Bell, Trash2, TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { useState } from "react";

const PERIODS = ["week", "month", "quarter", "year"] as const;
type Period = typeof PERIODS[number];

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>("month");
  const [alertPrice, setAlertPrice] = useState("");
  const [alertCondition, setAlertCondition] = useState<"below" | "above">("below");

  const { data: product, isLoading: isLoadingProduct } = useGetProduct(id, {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id) },
  });

  const { data: history, isLoading: isLoadingHistory } = useGetProductPriceHistory(id, period, {
    query: { enabled: !!id, queryKey: getGetProductPriceHistoryQueryKey(id, period) },
  });

  const oppParams = { page: 1, limit: 5, status: "active" as const };
  const { data: opportunities } = useListOpportunities(oppParams, {
    query: { queryKey: getListOpportunitiesQueryKey(oppParams) },
  });

  const alertParams = { active: true };
  const { data: alerts, isLoading: isLoadingAlerts } = useListAlerts(alertParams, {
    query: { queryKey: getListAlertsQueryKey(alertParams) },
  });

  const productAlerts = alerts?.filter((a) => a.productId === id) ?? [];

  const createAlert = useCreateAlert();
  const deleteAlert = useDeleteAlert();

  function handleCreateAlert() {
    const price = parseFloat(alertPrice);
    if (!isNaN(price) && price > 0) {
      createAlert.mutate(
        { data: { productId: id, targetPrice: price, condition: alertCondition, channels: ["email"] } },
        {
          onSuccess: () => {
            setAlertPrice("");
            queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey(alertParams) });
          },
        }
      );
    }
  }

  function handleDeleteAlert(alertId: number) {
    deleteAlert.mutate({ id: alertId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey(alertParams) }),
    });
  }

  const chartData = (history ?? []).map((h) => ({
    date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    price: h.price,
    marketplace: h.marketplace,
  }));

  const relatedOpps = opportunities?.items.filter((o) => o.productName === product?.name) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/products">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        {isLoadingProduct ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{product?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm capitalize">{product?.marketplace}</span>
              {product?.category && <Badge variant="outline" className="border-border/50 text-xs">{product.category}</Badge>}
              {product?.sku && <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {isLoadingProduct ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                <p className="text-2xl font-bold" data-testid="text-current-price">{formatCurrency(product?.currentPrice ?? 0)}</p>
                {product?.priceChangePercent !== null && product?.priceChangePercent !== undefined && (
                  <div className={`flex items-center gap-1 text-xs mt-1 ${product.priceChangePercent >= 0 ? "text-destructive" : "text-chart-1"}`}>
                    {product.priceChangePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(product.priceChangePercent).toFixed(2)}% (24h)
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Target Price</p>
                <p className="text-2xl font-bold">{formatCurrency(product?.targetPrice ?? 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">52-Week Low</p>
                <p className="text-2xl font-bold text-chart-1">{formatCurrency(product?.lowestPrice ?? 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">52-Week High</p>
                <p className="text-2xl font-bold text-destructive/80">{formatCurrency(product?.highestPrice ?? 0)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Price History</CardTitle>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <Button
                key={p}
                data-testid={`button-period-${p}`}
                variant={period === p ? "default" : "outline"}
                size="sm"
                className="capitalize text-xs"
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No price history available</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                    formatter={(v: number) => [formatCurrency(v), "Price"]}
                  />
                  <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#priceGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> Price Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={alertCondition} onValueChange={(v) => setAlertCondition(v as "below" | "above")}>
                <SelectTrigger className="w-28 bg-background/50 border-border/50" data-testid="select-alert-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="below">Below</SelectItem>
                  <SelectItem value="above">Above</SelectItem>
                </SelectContent>
              </Select>
              <Input
                data-testid="input-alert-price"
                type="number"
                placeholder="Price..."
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                className="bg-background/50 border-border/50"
              />
              <Button data-testid="button-create-alert" onClick={handleCreateAlert} disabled={createAlert.isPending}>
                <Bell className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {isLoadingAlerts ? (
                <Skeleton className="h-12 w-full" />
              ) : productAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No alerts set for this product.</p>
              ) : (
                productAlerts.map((alert) => (
                  <div key={alert.id} data-testid={`card-alert-${alert.id}`} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                    <div>
                      <span className="text-sm font-medium capitalize">{alert.condition}</span>
                      <span className="text-sm font-bold ml-2 text-primary">{formatCurrency(alert.targetPrice)}</span>
                      {alert.triggeredAt && (
                        <span className="text-xs text-chart-1 ml-2">Triggered {formatDate(alert.triggeredAt)}</span>
                      )}
                    </div>
                    <button
                      data-testid={`button-delete-alert-${alert.id}`}
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Related Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {relatedOpps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No active opportunities for this product.</p>
            ) : (
              <div className="space-y-3">
                {relatedOpps.map((opp) => (
                  <div key={opp.id} data-testid={`card-related-opp-${opp.id}`} className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span className="capitalize">{opp.buyMarketplace}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="capitalize">{opp.sellMarketplace}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">{formatCurrency(opp.buyPrice)} → {formatCurrency(opp.sellPrice)}</span>
                      <span className="text-sm font-bold text-chart-1">+{formatCurrency(opp.netProfit)}</span>
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
