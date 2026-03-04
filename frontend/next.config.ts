import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "images.unsplash.com"
  }
];

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

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

const nextConfig: NextConfig = {
  images: {
    remotePatterns
  }
};

export default nextConfig;
