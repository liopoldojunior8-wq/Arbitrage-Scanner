import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";

export const REFRESH_INTERVALS = [
  { label: "15s", value: 15_000 },
  { label: "30s", value: 30_000 },
  { label: "1m", value: 60_000 },
  { label: "5m", value: 300_000 },
  { label: "Off", value: 0 },
] as const;

export type RefreshInterval = typeof REFRESH_INTERVALS[number]["value"];

interface RefreshContextValue {
  interval: RefreshInterval;
  setInterval: (v: RefreshInterval) => void;
  lastRefreshed: Date | null;
  setLastRefreshed: (d: Date) => void;
  isRefreshing: boolean;
  setIsRefreshing: (v: boolean) => void;
  notificationsEnabled: boolean;
  requestNotifications: () => Promise<void>;
  newCount: number;
  setNewCount: (n: number) => void;
}

const RefreshContext = createContext<RefreshContextValue | null>(null);

const STORAGE_KEY = "arbitrage-refresh-interval";

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [interval, setIntervalState] = useState<RefreshInterval>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? parseInt(stored, 10) : 30_000;
    return (REFRESH_INTERVALS.some((r) => r.value === parsed) ? parsed : 30_000) as RefreshInterval;
  });
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => typeof Notification !== "undefined" && Notification.permission === "granted"
  );
  const [newCount, setNewCount] = useState(0);

  function setInterval(v: RefreshInterval) {
    setIntervalState(v);
    localStorage.setItem(STORAGE_KEY, String(v));
  }

  const requestNotifications = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
      return;
    }
    const result = await Notification.requestPermission();
    setNotificationsEnabled(result === "granted");
  }, []);

  return (
    <RefreshContext.Provider value={{
      interval,
      setInterval,
      lastRefreshed,
      setLastRefreshed,
      isRefreshing,
      setIsRefreshing,
      notificationsEnabled,
      requestNotifications,
      newCount,
      setNewCount,
    }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefreshContext() {
  const ctx = useContext(RefreshContext);
  if (!ctx) throw new Error("useRefreshContext must be used inside RefreshProvider");
  return ctx;
}
