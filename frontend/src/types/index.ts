export type ProductVariant = {
  id: string;
  label: string;
  price: number;
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  images: string[];
  videos?: string[];
  variants: ProductVariant[];
  featured?: boolean;
};

export type Review = {
  id: string;
  user: string;
  location: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  avatar: string;
};

export type Video = {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  embedUrl: string;
  category: "Informative" | "Product" | "Transformations";
};

export type CartItemType = {
  itemId: string;
  productId: string;
  variantId: string;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  total: number;
  status: "Processing" | "Packed" | "Shipped" | "Delivered";
  items: number;
};

export type TimelineStep = {
  label: string;
  date: string;
  complete: boolean;
  description: string;
};
