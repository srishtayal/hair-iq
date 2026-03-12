import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import GoogleAnalytics from "@/components/analytics/google-analytics";
import MetaPixel from "@/components/analytics/meta-pixel";
import SideCartDrawer from "@/components/cart/side-cart-drawer";
import { StoreProvider } from "@/context/store-context";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"]
});

const displayFont = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"]
});

export const metadata: Metadata = {
  title: "Hair IQ | Premium Men's Hair Patch Store",
  description: "Shop premium men's hair patch systems, maintenance essentials, and style guides from Hair IQ.",
  keywords: ["men hair patch", "hair system", "lace hair patch", "hair IQ"],
  openGraph: {
    title: "Hair IQ",
    description: "Premium men's hair patch systems with modern confidence.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        {gaMeasurementId ? (
          <Suspense fallback={null}>
            <GoogleAnalytics measurementId={gaMeasurementId} />
          </Suspense>
        ) : null}
        {metaPixelId ? (
          <Suspense fallback={null}>
            <MetaPixel pixelId={metaPixelId} />
          </Suspense>
        ) : null}
        <StoreProvider>
          <Navbar />
          <SideCartDrawer />
          <main className="pb-16">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
