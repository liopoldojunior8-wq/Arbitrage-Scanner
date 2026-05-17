import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOpportunities,
  useGetDashboardSummary,
  useGetTopOpportunities,
  useGetOpportunityStats,
  getListOpportunitiesQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetTopOpportunitiesQueryKey,
  getGetOpportunityStatsQueryKey,
} from "@workspace/api-client-react";
import { useRefreshContext } from "@/contexts/refresh-context";

function sendNotification(title: string, body: string, tag?: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      tag: tag ?? "arbitrage",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
    setTimeout(() => n.close(), 6000);
  } catch {}
}

interface OpportunityItem {
  id: number;
  productName: string;
  netProfit: number;
  roi: number;
  buyMarketplace: string;
  sellMarketplace: string;
}

export function useLiveOpportunities(params: {
  status: "active" | "expired" | "all";
  sortBy: "profit" | "roi" | "profit_percent";
  page: number;
  limit: number;
}) {
  const { interval, setLastRefreshed, setIsRefreshing, setNewCount, notificationsEnabled } =
    useRefreshContext();

  const seenIds = useRef<Set<number>>(new Set());
  const isFirstLoad = useRef(true);
  const queryClient = useQueryClient();

  const refetchInterval = interval > 0 ? interval : false;
  const queryKey = getListOpportunitiesQueryKey(params);

  const result = useListOpportunities(params, {
    query: {
      queryKey,
      refetchInterval: refetchInterval as number | false,
      refetchIntervalInBackground: false,
      notifyOnChangeProps: ["data", "isFetching"],
    },
  });

  useEffect(() => {
    if (result.isFetching) {
      setIsRefreshing(true);
    } else {
      setIsRefreshing(false);
      if (!result.isLoading) {
        setLastRefreshed(new Date());
      }
    }
  }, [result.isFetching, result.isLoading, setIsRefreshing, setLastRefreshed]);

  const newIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!result.data?.items) return;
    const items = result.data.items as OpportunityItem[];

    if (isFirstLoad.current) {
      items.forEach((item) => seenIds.current.add(item.id));
      isFirstLoad.current = false;
      return;
    }

    const incoming = items.filter((item) => !seenIds.current.has(item.id));
    if (incoming.length > 0) {
      incoming.forEach((item) => {
        seenIds.current.add(item.id);
        newIds.current.add(item.id);
      });
      setNewCount(incoming.length);

      if (notificationsEnabled) {
        const best = incoming.sort((a, b) => b.netProfit - a.netProfit)[0];
        sendNotification(
          `🚨 ${incoming.length} New Arbitrage Signal${incoming.length > 1 ? "s" : ""}`,
          `${best.productName}: +$${best.netProfit.toFixed(2)} profit (${best.roi.toFixed(0)}% ROI) — ${best.buyMarketplace} → ${best.sellMarketplace}`,
          "new-opportunity"
        );
      }

      // Auto-clear badge after 8 seconds
      setTimeout(() => setNewCount(0), 8000);
    }
  }, [result.data, notificationsEnabled, setNewCount]);

  const isNew = useCallback(
    (id: number) => newIds.current.has(id),
    []
  );

  function clearNew(id: number) {
    newIds.current.delete(id);
  }

  return { ...result, isNew, clearNew };
}

export function useLiveDashboard() {
  const { interval, setLastRefreshed, setIsRefreshing } = useRefreshContext();
  const refetchInterval = interval > 0 ? interval : false;

  const summary = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey(),
      refetchInterval: refetchInterval as number | false,
      refetchIntervalInBackground: false,
    },
  });

  const topOpps = useGetTopOpportunities({ limit: 5 }, {
    query: {
      queryKey: getGetTopOpportunitiesQueryKey({ limit: 5 }),
      refetchInterval: refetchInterval as number | false,
    },
  });

  useEffect(() => {
    const fetching = summary.isFetching || topOpps.isFetching;
    setIsRefreshing(fetching);
    if (!fetching && !summary.isLoading) {
      setLastRefreshed(new Date());
    }
  }, [summary.isFetching, topOpps.isFetching, summary.isLoading, setIsRefreshing, setLastRefreshed]);

  return { summary, topOpps };
}
