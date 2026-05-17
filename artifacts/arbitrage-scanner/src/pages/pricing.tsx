import { useListPlans, useGetCurrentSubscription } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { motion } from "framer-motion";
import { CheckCircle, Crown, Zap, Shield } from "lucide-react";

const PLAN_ICONS = [Zap, Shield, Crown];
const PLAN_COLORS = ["text-primary", "text-chart-4", "text-yellow-400"];
const PLAN_BG = ["bg-primary/5", "bg-chart-4/5", "bg-yellow-400/5"];
const PLAN_BORDER = ["border-primary/20", "border-chart-4/20", "border-yellow-400/30"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

export default function Pricing() {
  const { data: plans, isLoading } = useListPlans();
  const { data: subscription } = useGetCurrentSubscription();

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Scale your arbitrage operation with the right level of intelligence.
        </p>
      </div>

      {subscription && (
        <div className="max-w-sm mx-auto">
          <Card className="bg-primary/5 border-primary/20 text-center">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-lg font-bold text-primary">{subscription.planName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Renews {formatDate(subscription.currentPeriodEnd)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto"
        >
          {plans?.map((plan, index) => {
            const Icon = PLAN_ICONS[index % PLAN_ICONS.length];
            const color = PLAN_COLORS[index % PLAN_COLORS.length];
            const bg = PLAN_BG[index % PLAN_BG.length];
            const borderClass = PLAN_BORDER[index % PLAN_BORDER.length];
            const isCurrent = subscription?.planId === plan.id;

            return (
              <motion.div key={plan.id} variants={item} className={plan.isPopular ? "md:-mt-4" : ""}>
                <Card
                  data-testid={`card-plan-${plan.id}`}
                  className={`relative h-full flex flex-col border-2 transition-all ${plan.isPopular ? borderClass + " shadow-lg" : "border-border/50"} ${bg}`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-chart-4 text-white border-0 px-3">Most Popular</Badge>
                    </div>
                  )}

                  <CardHeader className="p-6 pb-4">
                    <div className={`p-2.5 rounded-xl ${bg} border ${borderClass} w-fit mb-3`}>
                      <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    <p className="text-lg font-bold" data-testid={`text-plan-name-${plan.id}`}>{plan.name}</p>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-black" data-testid={`text-plan-price-${plan.id}`}>
                        {plan.price === 0 ? "Free" : formatCurrency(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground text-sm">/{plan.interval}</span>
                      )}
                    </div>
                    {plan.productLimit !== null && plan.productLimit !== undefined ? (
                      <p className="text-xs text-muted-foreground mt-1">Up to {plan.productLimit} products</p>
                    ) : (
                      <p className="text-xs text-chart-1 mt-1 font-medium">Unlimited products</p>
                    )}
                  </CardHeader>

                  <CardContent className="p-6 pt-0 flex-1 flex flex-col">
                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((feature, fi) => (
                        <li key={fi} className="flex items-start gap-2.5">
                          <CheckCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${color}`} />
                          <span className="text-sm text-muted-foreground leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      data-testid={`button-select-plan-${plan.id}`}
                      className={`w-full mt-6 ${plan.isPopular ? "shadow-md" : ""}`}
                      variant={isCurrent ? "outline" : plan.isPopular ? "default" : "outline"}
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Current Plan" : plan.price === 0 ? "Get Started Free" : `Upgrade to ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>All plans include a 14-day free trial. No credit card required for Free plan.</p>
        <p>Payments processed securely via Stripe. Cancel anytime.</p>
      </div>
    </div>
  );
}
