import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "images.unsplash.com"
  },
  {
    protocol: "https",
    hostname: "res.cloudinary.com",
    pathname: "/**"
  },
  {
    protocol: "https",
    hostname: "cdn.shopify.com",
    pathname: "/**"
  }
];

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
const shopifyStoreDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");

if (backendBaseUrl) {
  try {
    const url = new URL(backendBaseUrl);
    remotePatterns.push({
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: "/**"
    });
  } catch {
    // Ignore invalid base URL at build time; runtime API calls will still surface config errors.
  }
}

if (shopifyStoreDomain) {
  remotePatterns.push({
    protocol: "https",
    hostname: shopifyStoreDomain,
    pathname: "/**"
  });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns
  }
};

export default nextConfig;
