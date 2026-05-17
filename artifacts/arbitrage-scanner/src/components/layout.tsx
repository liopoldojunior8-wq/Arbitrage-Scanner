import { Link, useLocation } from "wouter";
import { useTheme } from "./theme-provider";
import { 
  Activity, 
  AlertTriangle, 
  BarChart2, 
  Box, 
  CreditCard, 
  Globe, 
  LayoutDashboard, 
  Moon,
  Sun,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/opportunities", label: "Opportunities", icon: Target },
  { href: "/products", label: "Products", icon: Box },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/marketplaces", label: "Marketplaces", icon: Globe },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/50 bg-card/50 flex flex-col backdrop-blur-xl">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Activity className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-lg tracking-tight text-foreground">Arbitrage AI</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href} className="block">
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-full justify-center text-muted-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-8 sticky top-0 z-10">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Pro Plan</div>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium border border-primary/30">
              TR
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
