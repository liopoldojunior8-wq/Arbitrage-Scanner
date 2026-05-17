import { useRefreshContext, REFRESH_INTERVALS, type RefreshInterval } from "@/contexts/refresh-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, Bell, BellOff, Clock, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

function timeAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

export function RefreshBar() {
  const {
    interval,
    setInterval,
    lastRefreshed,
    isRefreshing,
    notificationsEnabled,
    requestNotifications,
    newCount,
  } = useRefreshContext();

  const queryClient = useQueryClient();

  function handleManualRefresh() {
    queryClient.invalidateQueries();
  }

  const currentLabel = REFRESH_INTERVALS.find((r) => r.value === interval)?.label ?? "30s";

  return (
    <div className="flex items-center gap-2">
      {/* New signals badge */}
      <AnimatePresence>
        {newCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
          >
            <Badge className="bg-chart-1 text-white border-0 gap-1 pr-2">
              <Zap className="h-3 w-3" />
              {newCount} new
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last refreshed */}
      {lastRefreshed && (
        <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo(lastRefreshed)}
        </span>
      )}

      {/* Manual refresh */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={handleManualRefresh}
        title="Refresh now"
      >
        <motion.div
          animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0 }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </motion.div>
      </Button>

      {/* Interval picker */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-border/50 bg-card/50 hidden sm:flex"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${interval > 0 ? "bg-chart-1 animate-pulse" : "bg-muted-foreground"}`} />
            {currentLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Auto-refresh</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={String(interval)}
            onValueChange={(v) => setInterval(parseInt(v, 10) as RefreshInterval)}
          >
            {REFRESH_INTERVALS.map((r) => (
              <DropdownMenuRadioItem key={r.value} value={String(r.value)} className="text-sm">
                {r.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Push notifications toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${notificationsEnabled ? "text-chart-1" : "text-muted-foreground"}`}
        onClick={requestNotifications}
        title={notificationsEnabled ? "Notifications on" : "Enable notifications"}
      >
        {notificationsEnabled ? (
          <Bell className="h-3.5 w-3.5" />
        ) : (
          <BellOff className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
