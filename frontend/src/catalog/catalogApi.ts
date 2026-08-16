import { apiRequest } from "../lib/api";
import type { PageInfo } from "../lib/pagination";

/** Category as products embed it — `include: { category: { select: { id, name } } }`. */
export interface CategoryRef {
  id: string;
  name: string;
}

/** GET /api/categories also returns a product count per category. */
export interface Category extends CategoryRef {
  _count: { products: number };
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  /** A string, not a number — see lib/money.ts. Always render via formatPrice. */
  price: string;
  stock: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category: CategoryRef;
}

export interface ProductListResponse {
  products: Product[];
  pagination: PageInfo;
}

export interface ProductListParams {
  page: number;
  limit: number;
  /** Empty string means "no search" — see the note in buildProductQuery. */
  search: string;
  /** Empty string means "all categories". */
  categoryId: string;
}

/**
 * Serialises list params for GET /api/products.
 *
 * Empty values are dropped rather than sent blank, and that is load-bearing:
 * the backend validates `search` as `z.string().trim().min(1).optional()` and
 * `categoryId` as a UUID, so `?search=&categoryId=` is a 400, not "no filter".
 * "Absent" and "empty" are different things to that schema.
 */
export function buildProductQuery(params: ProductListParams): string {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);

  return query.toString();
}

/**
 * Query keys. Kept together so a later cache invalidation (creating a product
 * from an admin screen, say) can't miss one by guessing the shape.
 */
export const catalogKeys = {
  products: (params: ProductListParams) => ["products", params] as const,
  product: (id: string) => ["product", id] as const,
  categories: () => ["categories"] as const,
};

// Both catalog endpoints are public, but the requests still carry the token
// (apiRequest's default). That is intentional: the pages sit behind
// ProtectedRoute, so a token that expired while the user was browsing should
// surface as the normal session-expiry redirect rather than letting the
// catalog quietly keep working for a signed-out user.
export function fetchProducts(params: ProductListParams): Promise<ProductListResponse> {
  return apiRequest<ProductListResponse>(`/api/products?${buildProductQuery(params)}`);
}

export function fetchProduct(id: string): Promise<Product> {
  return apiRequest<{ product: Product }>(`/api/products/${id}`).then((res) => res.product);
}

export function fetchCategories(): Promise<Category[]> {
  return apiRequest<{ categories: Category[] }>("/api/categories").then((res) => res.categories);
}
