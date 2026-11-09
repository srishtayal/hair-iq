import { Product } from "@/types";

type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  availableForSale: boolean;
  featuredImage: { url: string } | null;
  images: { nodes: Array<{ url: string }> };
  variants: {
    nodes: Array<{
      id: string;
      title: string;
      availableForSale: boolean;
      price: { amount: string };
    }>;
  };
};

type ShopifyResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1503951458645-643d53bfd90f?auto=format&fit=crop&w=1200&q=80";

const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN?.trim();
const apiVersion = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION?.trim() || "2026-07";

export const isShopifyConfigured = Boolean(shopDomain && storefrontToken);

const productFields = `
  id
  handle
  title
  description
  productType
  tags
  availableForSale
  featuredImage { url }
  images(first: 10) { nodes { url } }
  variants(first: 100) {
    nodes {
      id
      title
      availableForSale
      price { amount }
    }
  }
`;

const request = async <T>(query: string, variables?: Record<string, unknown>) => {
  if (!isShopifyConfigured || !shopDomain || !storefrontToken) {
    throw new Error("Shopify storefront credentials are not configured");
  }

  const response = await fetch(`https://${shopDomain}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  });

  const body = (await response.json()) as ShopifyResponse<T>;
  if (!response.ok || body.errors?.length || !body.data) {
    throw new Error(body.errors?.map((error) => error.message).join(", ") || "Unable to load Shopify products");
  }

  return body.data;
};

const mapProduct = (product: ShopifyProduct): Product => {
  const variants = product.variants.nodes.map((variant) => ({
    id: variant.id,
    label: variant.title === "Default Title" ? "Default" : variant.title,
    price: Number(variant.price.amount),
    // Storefront API exposes sale availability, not the actual stock count.
    stock: variant.availableForSale ? 999 : 0,
  }));
  const images = product.images.nodes.map((image) => image.url);
  const basePrice = variants[0]?.price ?? 0;
  const description = product.description || "Premium Hair IQ product.";

  return {
    id: product.id,
    slug: product.handle,
    name: product.title,
    shortDescription: description.length > 120 ? `${description.slice(0, 117).trimEnd()}...` : description,
    description,
    category: product.productType || "Hair Systems",
    basePrice,
    rating: 0,
    reviewCount: 0,
    tags: product.tags,
    images: images.length ? images : [product.featuredImage?.url || FALLBACK_IMAGE],
    variants,
  };
};

export const fetchShopifyProducts = async () => {
  const data = await request<{ products: { nodes: ShopifyProduct[] } }>(
    `query ShopifyProducts { products(first: 100, sortKey: CREATED_AT, reverse: true) { nodes { ${productFields} } } }`
  );
  return data.products.nodes.map(mapProduct);
};

export const fetchShopifyProductByHandle = async (handle: string) => {
  const data = await request<{ product: ShopifyProduct | null }>(
    `query ShopifyProduct($handle: String!) { product(handle: $handle) { ${productFields} } }`,
    { handle }
  );

  if (!data.product) throw new Error("Product not found");
  return mapProduct(data.product);
};

type ShopifyCartLine = {
  merchandiseId: string;
  quantity: number;
};

type ShopifyBuyerIdentity = {
  email?: string;
  phone?: string;
};

export const createShopifyCheckout = async ({
  lines,
  buyerIdentity,
}: {
  lines: ShopifyCartLine[];
  buyerIdentity?: ShopifyBuyerIdentity;
}) => {
  const data = await request<{
    cartCreate: {
      cart: { checkoutUrl: string } | null;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  }>(
    `mutation CreateCart($input: CartInput!) {
      cartCreate(input: $input) {
        cart { checkoutUrl }
        userErrors { field message }
      }
    }`,
    {
      input: {
        lines,
        ...(buyerIdentity && (buyerIdentity.email || buyerIdentity.phone) ? { buyerIdentity } : {}),
      },
    }
  );

  const result = data.cartCreate;
  if (result.userErrors.length) {
    throw new Error(result.userErrors.map((error) => error.message).join(", "));
  }
  if (!result.cart?.checkoutUrl) {
    throw new Error("Shopify could not create a checkout session");
  }

  return result.cart.checkoutUrl;
};
