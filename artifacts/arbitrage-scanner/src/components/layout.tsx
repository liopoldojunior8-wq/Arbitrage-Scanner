import { Link, useLocation } from "wouter";
import { useTheme } from "./theme-provider";
import { RefreshBar } from "./refresh-bar";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Box,
  Calculator,
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings2,
  Sun,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/opportunities", label: "Opportunities", icon: Target },
  { href: "/calculator", label: "Profit Calculator", icon: Calculator },
  { href: "/products", label: "Products", icon: Box },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/marketplaces", label: "Marketplaces", icon: Globe },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/admin", label: "Admin", icon: Settings2 },
];

function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="block" onClick={onClick}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={`w-full justify-start gap-2 ${
          isActive
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </Button>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const visibleNavItems = navItems.filter(
    (item) => item.href !== "/admin" || isAdmin
  );

  const Sidebar = (
    <aside className="flex flex-col h-full bg-card/95 backdrop-blur-xl border-r border-border/50 w-64 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-border/50 gap-2">
        <Activity className="h-6 w-6 text-primary shrink-0" />
        <span className="font-bold text-lg tracking-tight text-foreground">Arbitrage AI</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));
          return (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive}
              onClick={() => setMobileOpen(false)}
            />
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 space-y-2">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs border border-primary/30 shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
              {isAdmin && (
                <p className="text-[10px] text-primary font-medium">Admin</p>
              )}
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="text-sm">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </Button>

        {user && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Sign Out</span>
          </Button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 shrink-0 h-screen sticky top-0">
        {Sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="sidebar"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
            >
              {Sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 md:h-16 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 md:px-6 sticky top-0 z-30 gap-3">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground h-8 w-8 shrink-0"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-1.5 mr-auto">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm tracking-tight">Arbitrage AI</span>
          </div>

          <div className="hidden md:block flex-1" />

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            <RefreshBar />
            {user && (
              <>
                <div className="h-4 w-px bg-border/50 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2">
                  <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {displayName}
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs border border-primary/30 shrink-0">
                    {initials}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => signOut()}
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
