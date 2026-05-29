import { useState } from "react";
import { useArbitrageProducts } from "@/hooks/use-arbitrage-products";
import { isValidUrl, type ArbitrageProduct } from "@/lib/supabase-products";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Package,
  Search,
  TrendingDown,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { SiEbay, SiWalmart, SiAliexpress, SiEtsy } from "react-icons/si";

function MarketplaceIcon({ marketplace }: { marketplace: string }) {
  const cls = "h-3.5 w-3.5";
  const m = marketplace.toLowerCase();
  if (m.includes("amazon"))
    return (
      <span className="text-[9px] font-black text-[#FF9900] leading-none">
        AMZ
      </span>
    );
  if (m.includes("ebay")) return <SiEbay className={`${cls} text-[#E53238]`} />;
  if (m.includes("walmart"))
    return <SiWalmart className={`${cls} text-[#0071CE]`} />;
  if (m.includes("aliexpress"))
    return <SiAliexpress className={`${cls} text-[#FF4747]`} />;
  if (m.includes("etsy")) return <SiEtsy className={`${cls} text-[#F1641E]`} />;
  return <Package className={cls} />;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

function ProductCard({ product }: { product: ArbitrageProduct }) {
  const hasUrl = isValidUrl(product.product_url);
  const profitable = product.profit > 0;

  const cardContent = (
    <CardContent className="p-3 md:p-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/30">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.product_name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="font-semibold text-sm truncate leading-tight group-hover:text-primary transition-colors">
              {product.product_name}
            </p>
            {hasUrl && (
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MarketplaceIcon marketplace={product.marketplace} />
            <span className="text-xs text-muted-foreground capitalize">
              {product.marketplace}
            </span>
          </div>
        </div>
      </div>

      {/* Prices */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="bg-background/50 rounded-lg p-2 border border-border/30">
          <p className="text-[10px] text-muted-foreground">Buy Price</p>
          <p className="text-sm font-bold text-foreground">
            ${product.buy_price.toFixed(2)}
          </p>
        </div>
        <div className="bg-background/50 rounded-lg p-2 border border-border/30">
          <p className="text-[10px] text-muted-foreground">Sell Price</p>
          <p className="text-sm font-bold text-foreground">
            ${product.sell_price.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Profit / ROI */}
      <div className="mt-2.5 pt-2.5 border-t border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {profitable ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          )}
          <span
            className={`text-sm font-bold ${
              profitable ? "text-green-500" : "text-destructive"
            }`}
          >
            {profitable ? "+" : ""}${product.profit.toFixed(2)}
          </span>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] border ${
            profitable
              ? "border-green-500/30 text-green-500 bg-green-500/10"
              : "border-destructive/30 text-destructive bg-destructive/10"
          }`}
        >
          {profitable ? "+" : ""}
          {product.roi.toFixed(1)}% ROI
        </Badge>
      </div>
    </CardContent>
  );

  return (
    <motion.div variants={item}>
      {hasUrl ? (
        <a
          href={product.product_url!}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="bg-card/50 border-border/50 hover:border-primary/40 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)] transition-all group cursor-pointer">
            {cardContent}
          </Card>
        </a>
      ) : (
        <Card className="bg-card/50 border-border/50 hover:border-border transition-all group">
          {cardContent}
        </Card>
      )}
    </motion.div>
  );
}

export default function Products() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading, error } = useArbitrageProducts();

  const filtered = (products ?? []).filter(
    (p) =>
      !search ||
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.marketplace.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Products
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm hidden sm:block">
            Arbitrage products tracked across marketplaces.
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-border/50">
          {filtered.length} products
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or marketplace..."
          className="pl-10 bg-card/50 border-border/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load products. Check your Supabase connection.</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      )}

      {!isLoading && filtered.length === 0 && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {search ? "No products match your search" : "No products yet"}
          </p>
          <p className="text-sm mt-1">
            {search
              ? "Try a different search term."
              : "Add products in the Admin → Products tab."}
          </p>
        </div>
      )}
    </div>
  );
}
