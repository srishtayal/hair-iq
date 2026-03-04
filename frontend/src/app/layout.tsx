import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { StoreProvider } from "@/context/store-context";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
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
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <StoreProvider>
          <Navbar />
          <main className="pb-16">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
