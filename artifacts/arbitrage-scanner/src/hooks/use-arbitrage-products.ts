import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchArbitrageProducts,
  fetchArbitrageProduct,
  createArbitrageProduct,
  updateArbitrageProduct,
  deleteArbitrageProduct,
  type CreateArbitrageProduct,
  type UpdateArbitrageProduct,
} from "@/lib/supabase-products";

export const PRODUCTS_KEY = ["arbitrage_products"] as const;
export const PRODUCT_KEY = (id: string) => ["arbitrage_products", id] as const;

export function useArbitrageProducts() {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: fetchArbitrageProducts,
    staleTime: 30_000,
  });
}

export function useArbitrageProduct(id: string) {
  return useQuery({
    queryKey: PRODUCT_KEY(id),
    queryFn: () => fetchArbitrageProduct(id),
    enabled: !!id,
  });
}

export function useCreateArbitrageProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateArbitrageProduct) => createArbitrageProduct(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useUpdateArbitrageProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateArbitrageProduct }) =>
      updateArbitrageProduct(id, input),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      qc.invalidateQueries({ queryKey: PRODUCT_KEY(id) });
    },
  });
}

export function useDeleteArbitrageProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteArbitrageProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}
