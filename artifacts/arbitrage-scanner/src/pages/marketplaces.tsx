import { useListMarketplaces } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Globe, Package, CheckCircle, XCircle } from "lucide-react";
import { SiEbay, SiWalmart, SiAliexpress, SiEtsy, SiShopify, SiMeta } from "react-icons/si";

const MARKETPLACE_ICONS: Record<string, React.ElementType | null> = {
  amazon: null,
  ebay: SiEbay,
  walmart: SiWalmart,
  aliexpress: SiAliexpress,
  etsy: SiEtsy,
  shopify: SiShopify,
  facebook: SiMeta,
};

const MARKETPLACE_COLORS: Record<string, string> = {
  amazon: "text-[#FF9900]",
  ebay: "text-[#E53238]",
  walmart: "text-[#0071CE]",
  aliexpress: "text-[#FF4747]",
  etsy: "text-[#F1641E]",
  shopify: "text-[#96BF48]",
  facebook: "text-[#1877F2]",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Marketplaces() {
  const { data: marketplaces, isLoading } = useListMarketplaces();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketplaces</h1>
        <p className="text-muted-foreground mt-1">Monitored platforms and their current status.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {marketplaces?.map((mp) => {
            const Icon = MARKETPLACE_ICONS[mp.slug];
            const iconColor = MARKETPLACE_COLORS[mp.slug] ?? "text-muted-foreground";
            return (
              <motion.div key={mp.id} variants={item}>
                <Card
                  data-testid={`card-marketplace-${mp.id}`}
                  className={`bg-card/50 border-border/50 hover:border-primary/30 transition-all ${!mp.isActive ? "opacity-60" : ""}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
                          {Icon ? (
                            <Icon className={`h-6 w-6 ${iconColor}`} />
                          ) : (
                            <span className={`text-sm font-black ${iconColor}`}>AMZ</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold" data-testid={`text-marketplace-name-${mp.id}`}>{mp.name}</p>
                          <p className="text-xs text-muted-foreground">{mp.country} · {mp.currency}</p>
                        </div>
                      </div>
                      {mp.isActive ? (
                        <CheckCircle className="h-4 w-4 text-chart-1 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        <span>{mp.productCount} products</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${mp.isActive ? "border-chart-1/40 text-chart-1" : "border-border/40 text-muted-foreground"}`}
                      >
                        {mp.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Card className="bg-card/50 border-border/50 border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Globe className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium text-sm">More Marketplaces Coming Soon</p>
          <p className="text-xs mt-1">Mercado Livre, Takealot, Alibaba, Best Buy, Temu</p>
        </CardContent>
      </Card>
    </div>
  );
}
