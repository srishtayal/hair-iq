import { Product } from "@/types";
import { apiRequest } from "@/lib/api";

type BackendVariant = {
  id: string;
  size: string | null;
  color: string | null;
  density: string | null;
  price: number;
  stockQuantity: number;
  sku: string;
};

type BackendMedia = {
  id: string;
  type: "image" | "video";
  url: string;
  sortOrder: number;
};

type BackendProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
  description: string | null;
  price: number;
  category: string;
  thumbnail: string | null;
  topVariant: BackendVariant | null;
  variants?: BackendVariant[];
  media?: BackendMedia[];
};

type ProductListResponse = {
  success: true;
  data: {
    items: BackendProduct[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

type ProductDetailResponse = {
  success: true;
  data: BackendProduct;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1503951458645-643d53bfd90f?auto=format&fit=crop&w=1200&q=80";

const absoluteUrl = (value: string) => {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  if (!baseUrl) {
    return value;
  }

  return `${baseUrl.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
};

const parseSizeParts = (value: string | null) => {
  if (!value) return null;
  const matches = value.match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length < 2) return null;

  return {
    first: Number(matches[0]),
    second: Number(matches[1])
  };
};

const compareVariantSizes = (a: BackendVariant, b: BackendVariant) => {
  const aSize = parseSizeParts(a.size);
  const bSize = parseSizeParts(b.size);

  if (aSize && bSize) {
    if (aSize.first !== bSize.first) return aSize.first - bSize.first;
    if (aSize.second !== bSize.second) return aSize.second - bSize.second;
    return (a.size || "").localeCompare(b.size || "");
  }

  if (aSize) return -1;
  if (bSize) return 1;
  return (a.size || "").localeCompare(b.size || "");
};

const getVariantLabel = (variant: BackendVariant) => {
  return variant.size?.trim() || variant.sku || "Default";
};

const toShortDescription = (description: string, maxLength = 120) => {
  if (description.length <= maxLength) return description;
  return `${description.slice(0, maxLength).trimEnd()}...`;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getStableRandomRating = (seed: string) => {
  const hashed = hashString(seed);
  const min = 4.1;
  const max = 4.9;
  const normalized = (hashed % 1000) / 1000;
  const value = min + (max - min) * normalized;
  return Number(value.toFixed(1));
};

const getStableRandomReviewCount = (seed: string) => {
  const hashed = hashString(`${seed}-reviews`);
  return 200 + (hashed % 201);
};

const mapProduct = (item: BackendProduct): Product => {
  const variants = item.variants && item.variants.length ? item.variants : item.topVariant ? [item.topVariant] : [];

  const images = (item.media || [])
    .filter((mediaItem) => mediaItem.type === "image")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((mediaItem) => absoluteUrl(mediaItem.url));

  const videos = (item.media || [])
    .filter((mediaItem) => mediaItem.type === "video")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((mediaItem) => absoluteUrl(mediaItem.url));

  if (!images.length && item.thumbnail) {
    images.push(absoluteUrl(item.thumbnail));
  }

  const resolvedDescription = item.longDescription || item.description || item.shortDescription || "Premium Hair IQ product.";
  const resolvedShortDescription = item.shortDescription || toShortDescription(resolvedDescription);
  const effectivePrice = item.price > 0 ? item.price : (item.topVariant?.price ?? 0);

  const mappedVariants = [...variants]
    .sort(compareVariantSizes)
    .map((variant) => ({
    id: variant.id,
    label: getVariantLabel(variant),
    price: effectivePrice || variant.price,
    stock: variant.stockQuantity
    }));

  const fallbackPrice = effectivePrice || item.topVariant?.price || 0;
  const basePrice = fallbackPrice;
  const rating = getStableRandomRating(item.id || item.slug || item.name);
  const reviewCount = getStableRandomReviewCount(item.id || item.slug || item.name);

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    shortDescription: resolvedShortDescription,
    description: resolvedDescription,
    category: item.category,
    basePrice,
    rating,
    reviewCount,
    tags: [],
    images: images.length ? images : [FALLBACK_IMAGE],
    videos,
    variants: mappedVariants
  };
};

export const fetchProducts = async () => {
  const response = await apiRequest<ProductListResponse>("/products?page=1&limit=100");
  return response.data.items.map(mapProduct);
};

export const fetchProductBySlug = async (slug: string) => {
  const response = await apiRequest<ProductDetailResponse>(`/products/${encodeURIComponent(slug)}`);
  return mapProduct(response.data);
};
