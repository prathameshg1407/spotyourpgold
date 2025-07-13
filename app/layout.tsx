import type { Metadata } from "next";
import { Inter, Poppins, Zen_Tokyo_Zoo, Parisienne } from "next/font/google";
import "./globals.css";
import { DockWrapper } from "@/components/DockWrapper";
import { Toaster } from "@/components/ui/sonner";
import PageLoader from "@/components/PageLoader";
import AuthProvider from "@/components/AuthProvider";
import { GoogleAnalytics } from "@next/third-parties/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

// const zen = Zen_Tokyo_Zoo({
//   subsets: ["latin"],
//   variable: "--font-zen-tokyo-zoo",
//   weight: ["400"],
// });

const parisienne = Parisienne({
  subsets: ["latin"],
  variable: "--font-parisienne",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "PG Rental - Find Your Perfect Paying Guest Accommodation",
  description:
    "Discover and book the best paying guest accommodations. Find PG rentals, hostels, and shared accommodations with verified owners and detailed listings.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body
        className={` ${inter.variable} ${poppins.variable} ${parisienne.variable} `}
      >
        <GoogleAnalytics gaId="G-5PWF1SMC4Q" />
        <AuthProvider />
        <PageLoader />
        {children}
        <Toaster />
        <DockWrapper />
      </body>
    </html>
  );
}
