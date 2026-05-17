import { useState } from "react";
import { useListAlerts, useUpdateAlert, useDeleteAlert, getListAlertsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, formatDate } from "@/lib/format";
import { motion } from "framer-motion";
import { Bell, BellOff, Trash2, CheckCircle, AlertTriangle } from "lucide-react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Alerts() {
  const [filter, setFilter] = useState<boolean | undefined>(undefined);
  const queryClient = useQueryClient();

  const params = { active: filter };
  const { data: alerts, isLoading } = useListAlerts(params, {
    query: { queryKey: getListAlertsQueryKey(params) },
  });

  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();

  function handleToggle(id: number, current: boolean) {
    updateAlert.mutate({ id, data: { isActive: !current } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey(params) }),
    });
  }

  function handleDelete(id: number) {
    deleteAlert.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey(params) }),
    });
  }

  const triggered = alerts?.filter((a) => a.triggeredAt) ?? [];
  const pending = alerts?.filter((a) => !a.triggeredAt && a.isActive) ?? [];
  const inactive = alerts?.filter((a) => !a.isActive) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Price Alerts</h1>
        <p className="text-muted-foreground mt-1">Get notified when prices hit your targets.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-chart-1/10 border-chart-1/20">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-chart-1" />
            <div>
              <p className="text-2xl font-bold">{triggered.length}</p>
              <p className="text-xs text-muted-foreground">Triggered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{pending.length}</p>
              <p className="text-xs text-muted-foreground">Active Watchers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <BellOff className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{inactive.length}</p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {([
          { label: "All", value: undefined },
          { label: "Active", value: true },
          { label: "Inactive", value: false },
        ] as const).map((opt) => (
          <Button
            key={String(opt.value)}
            data-testid={`button-filter-${opt.label.toLowerCase()}`}
            variant={filter === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(opt.value as boolean | undefined)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {alerts?.map((alert) => (
            <motion.div key={alert.id} variants={item}>
              <Card
                data-testid={`card-alert-${alert.id}`}
                className={`bg-card/50 border-border/50 transition-all ${alert.triggeredAt ? "border-chart-1/30" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${alert.triggeredAt ? "bg-chart-1/15" : alert.isActive ? "bg-primary/10" : "bg-muted"}`}>
                      {alert.triggeredAt ? (
                        <CheckCircle className="h-5 w-5 text-chart-1" />
                      ) : alert.isActive ? (
                        <Bell className="h-5 w-5 text-primary" />
                      ) : (
                        <BellOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" data-testid={`text-alert-product-${alert.id}`}>{alert.productName}</span>
                        <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground capitalize">{alert.marketplace}</Badge>
                        {alert.triggeredAt && (
                          <Badge className="text-xs bg-chart-1/20 text-chart-1 border-chart-1/30">Triggered</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="text-muted-foreground">Alert when price goes</span>
                        <span className="font-medium capitalize text-primary">{alert.condition}</span>
                        <span className="font-bold" data-testid={`text-alert-target-${alert.id}`}>{formatCurrency(alert.targetPrice)}</span>
                        {alert.currentPrice && (
                          <span className="text-xs text-muted-foreground">Current: {formatCurrency(alert.currentPrice)}</span>
                        )}
                      </div>
                      {alert.triggeredAt && (
                        <p className="text-xs text-chart-1 mt-1">Triggered at {formatDate(alert.triggeredAt)}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {alert.channels.length > 0 && (
                        <div className="flex gap-1">
                          {alert.channels.map((ch) => (
                            <Badge key={ch} variant="outline" className="text-xs capitalize border-border/40">{ch}</Badge>
                          ))}
                        </div>
                      )}
                      <Switch
                        data-testid={`switch-alert-${alert.id}`}
                        checked={alert.isActive}
                        onCheckedChange={() => handleToggle(alert.id, alert.isActive)}
                      />
                      <button
                        data-testid={`button-delete-alert-${alert.id}`}
                        onClick={() => handleDelete(alert.id)}
                        className="text-muted-foreground/50 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!isLoading && (!alerts || alerts.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No alerts configured</p>
          <p className="text-sm mt-1">Go to a product page to set up price alerts.</p>
        </div>
      )}
    </div>
  );
}
