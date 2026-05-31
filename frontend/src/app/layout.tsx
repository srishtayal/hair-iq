import GoogleAnalytics from "@/components/analytics/google-analytics";
import MetaPixel from "@/components/analytics/meta-pixel";
import SideCartDrawer from "@/components/cart/side-cart-drawer";
import MaintenanceScreen from "@/components/layout/maintenance-screen";
import { StoreProvider } from "@/context/store-context";
import { isMaintenanceMode } from "@/lib/site-config";
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: isMaintenanceMode ? "Hair IQ | Under Maintenance" : "Hair IQ | Premium Men's Hair Patch Store",
  description: isMaintenanceMode
    ? "Hair IQ is temporarily under maintenance. Please check back soon."
    : "Shop premium men's hair patch systems, maintenance essentials, and style guides from Hair IQ.",
  keywords: ["men hair patch", "hair system", "lace hair patch", "hair IQ"],
  openGraph: {
    title: isMaintenanceMode ? "Hair IQ | Under Maintenance" : "Hair IQ",
    description: isMaintenanceMode
      ? "Hair IQ is temporarily under maintenance. Please check back soon."
      : "Premium men's hair patch systems with modern confidence.",
    type: "website"
  },
  robots: isMaintenanceMode ? { index: false, follow: false } : undefined
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="en">
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
          {isMaintenanceMode ? (
            <MaintenanceScreen />
          ) : (
            <>
              <SideCartDrawer />
              <main className="pb-16">{children}</main>
            </>
          )}
        </StoreProvider>
      </body>
    </html>
  );
}
