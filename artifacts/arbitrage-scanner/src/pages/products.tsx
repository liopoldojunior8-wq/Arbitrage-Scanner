import { useState } from "react";
import { useListProducts, useToggleProductFavorite, useDeleteProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/format";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Search, Star, TrendingDown, TrendingUp, Trash2, Plus, Package } from "lucide-react";
import { SiEbay, SiWalmart, SiAliexpress, SiEtsy } from "react-icons/si";

function MarketplaceIcon({ marketplace }: { marketplace: string }) {
  const cls = "h-4 w-4";
  const m = marketplace.toLowerCase();
  if (m === "amazon") return <span className="text-[10px] font-black text-[#FF9900]">AMZ</span>;
  if (m === "ebay") return <SiEbay className={`${cls} text-[#E53238]`} />;
  if (m === "walmart") return <SiWalmart className={`${cls} text-[#0071CE]`} />;
  if (m === "aliexpress") return <SiAliexpress className={`${cls} text-[#FF4747]`} />;
  if (m === "etsy") return <SiEtsy className={`${cls} text-[#F1641E]`} />;
  return <Package className={cls} />;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function Products() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const params = { search: search || undefined, page, limit: 20 };
  const { data, isLoading } = useListProducts(params, { query: { queryKey: getListProductsQueryKey(params) } });

  const toggleFav = useToggleProductFavorite();
  const deleteProduct = useDeleteProduct();

  function handleToggleFav(id: number) {
    toggleFav.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(params) }),
    });
  }

  function handleDelete(id: number) {
    deleteProduct.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(params) }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage tracked products across marketplaces.</p>
        </div>
        <Button data-testid="button-add-product" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-search-products"
          placeholder="Search by name, SKU, or ASIN..."
          className="pl-10 bg-card/50 border-border/50"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {data?.items.map((product) => (
            <motion.div key={product.id} variants={item}>
              <Card data-testid={`card-product-${product.id}`} className="bg-card/50 border-border/50 hover:border-primary/30 transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${product.id}`}>
                        <p className="font-semibold text-sm truncate hover:text-primary transition-colors cursor-pointer" data-testid={`text-product-name-${product.id}`}>
                          {product.name}
                        </p>
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MarketplaceIcon marketplace={product.marketplace} />
                        <span className="text-xs text-muted-foreground capitalize">{product.marketplace}</span>
                        <Badge variant="outline" className="text-xs ml-1 border-border/50">{product.category}</Badge>
                      </div>
                    </div>
                    <button
                      data-testid={`button-favorite-${product.id}`}
                      onClick={() => handleToggleFav(product.id)}
                      className="text-muted-foreground hover:text-yellow-400 transition-colors flex-shrink-0"
                    >
                      <Star className={`h-4 w-4 ${product.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </button>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold" data-testid={`text-price-${product.id}`}>
                        {formatCurrency(product.currentPrice)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Target: {formatCurrency(product.targetPrice)}
                      </div>
                    </div>
                    {product.priceChangePercent !== null && product.priceChangePercent !== undefined && (
                      <div className={`flex items-center gap-1 text-sm font-medium ${product.priceChangePercent >= 0 ? "text-destructive" : "text-chart-1"}`}>
                        {product.priceChangePercent >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {Math.abs(product.priceChangePercent).toFixed(2)}%
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                    <div className="flex gap-1 text-xs text-muted-foreground">
                      {product.lowestPrice && <span>Low: {formatCurrency(product.lowestPrice)}</span>}
                      {product.lowestPrice && product.highestPrice && <span>·</span>}
                      {product.highestPrice && <span>High: {formatCurrency(product.highestPrice)}</span>}
                    </div>
                    <button
                      data-testid={`button-delete-product-${product.id}`}
                      onClick={() => handleDelete(product.id)}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">Page {page}</span>
          <Button variant="outline" size="sm" disabled={data.items.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {!isLoading && (!data?.items || data.items.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">Try adjusting your search or add a new product to monitor.</p>
        </div>
      )}
    </div>
  );
}
