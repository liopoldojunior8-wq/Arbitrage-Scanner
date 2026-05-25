import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { RefreshProvider } from "@/contexts/refresh-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { Loader2 } from "lucide-react";

// Pages
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Opportunities from "@/pages/opportunities";
import Alerts from "@/pages/alerts";
import Marketplaces from "@/pages/marketplaces";
import Pricing from "@/pages/pricing";
import Calculator from "@/pages/calculator";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import Register from "@/pages/register";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 10_000,
    },
  },
});

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Auth routes — no Layout wrapper, accessible without login */}
      <Route path="/login">
        {user ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/register">
        {user ? <Redirect to="/" /> : <Register />}
      </Route>

      {/* Protected app routes — wrapped in Layout */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/">
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            </Route>
            <Route path="/products">
              <ProtectedRoute><Products /></ProtectedRoute>
            </Route>
            <Route path="/products/:id">
              <ProtectedRoute><ProductDetail /></ProtectedRoute>
            </Route>
            <Route path="/opportunities">
              <ProtectedRoute><Opportunities /></ProtectedRoute>
            </Route>
            <Route path="/alerts">
              <ProtectedRoute><Alerts /></ProtectedRoute>
            </Route>
            <Route path="/marketplaces">
              <ProtectedRoute><Marketplaces /></ProtectedRoute>
            </Route>
            <Route path="/pricing">
              <ProtectedRoute><Pricing /></ProtectedRoute>
            </Route>
            <Route path="/calculator">
              <ProtectedRoute><Calculator /></ProtectedRoute>
            </Route>
            <Route path="/admin">
              <ProtectedRoute adminOnly><Admin /></ProtectedRoute>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="arbitrage-theme">
        <AuthProvider>
          <RefreshProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </RefreshProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
