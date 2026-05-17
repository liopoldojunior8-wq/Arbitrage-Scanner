import { useState } from "react";
import { useListAlerts, useUpdateAlert, useDeleteAlert, getListAlertsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRefreshContext } from "@/contexts/refresh-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, formatDate } from "@/lib/format";
import { motion } from "framer-motion";
import { Bell, BellOff, Trash2, CheckCircle, AlertTriangle } from "lucide-react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Alerts() {
  const [filter, setFilter] = useState<boolean | undefined>(undefined);
  const queryClient = useQueryClient();
  const { interval } = useRefreshContext();

  const params = { active: filter };
  const refetchInterval = interval > 0 ? interval : false;

  const { data: alerts, isLoading } = useListAlerts(params, {
    query: {
      queryKey: getListAlertsQueryKey(params),
      refetchInterval: refetchInterval as number | false,
    },
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
    <div className="space-y-5 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Price Alerts</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">Get notified when prices hit your targets.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-chart-1/10 border-chart-1/20">
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-chart-1 shrink-0" />
            <div>
              <p className="text-lg md:text-2xl font-bold">{triggered.length}</p>
              <p className="text-xs text-muted-foreground">Triggered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <Bell className="h-6 w-6 md:h-8 md:w-8 text-primary shrink-0" />
            <div>
              <p className="text-lg md:text-2xl font-bold">{pending.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <BellOff className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground shrink-0" />
            <div>
              <p className="text-lg md:text-2xl font-bold">{inactive.length}</p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
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
            className="h-8 text-xs"
            onClick={() => setFilter(opt.value as boolean | undefined)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2 md:space-y-3">
          {alerts?.map((alert) => (
            <motion.div key={alert.id} variants={item}>
              <Card
                data-testid={`card-alert-${alert.id}`}
                className={`bg-card/50 border-border/50 transition-all ${alert.triggeredAt ? "border-chart-1/30" : ""}`}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start md:items-center gap-3">
                    <div
                      className={`p-1.5 md:p-2 rounded-lg shrink-0 mt-0.5 md:mt-0 ${
                        alert.triggeredAt ? "bg-chart-1/15" : alert.isActive ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      {alert.triggeredAt ? (
                        <CheckCircle className="h-4 w-4 text-chart-1" />
                      ) : alert.isActive ? (
                        <Bell className="h-4 w-4 text-primary" />
                      ) : (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="font-semibold text-sm"
                          data-testid={`text-alert-product-${alert.id}`}
                        >
                          {alert.productName}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border/40 text-muted-foreground capitalize"
                        >
                          {alert.marketplace}
                        </Badge>
                        {alert.triggeredAt && (
                          <Badge className="text-[10px] bg-chart-1/20 text-chart-1 border-chart-1/30">
                            Triggered
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs md:text-sm flex-wrap">
                        <span className="text-muted-foreground">Price goes</span>
                        <span className="font-medium capitalize text-primary">{alert.condition}</span>
                        <span className="font-bold" data-testid={`text-alert-target-${alert.id}`}>
                          {formatCurrency(alert.targetPrice)}
                        </span>
                        {alert.currentPrice && (
                          <span className="text-xs text-muted-foreground">
                            Current: {formatCurrency(alert.currentPrice)}
                          </span>
                        )}
                      </div>

                      {alert.triggeredAt && (
                        <p className="text-xs text-chart-1 mt-0.5">
                          Triggered {formatDate(alert.triggeredAt)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {alert.channels.length > 0 && (
                        <div className="hidden sm:flex gap-1">
                          {alert.channels.map((ch) => (
                            <Badge key={ch} variant="outline" className="text-[10px] capitalize border-border/40">
                              {ch}
                            </Badge>
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
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No alerts configured</p>
          <p className="text-sm mt-1">Go to a product page to set up price alerts.</p>
        </div>
      )}
    </div>
  );
}
