"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Don't render footer on dashboard pages
  if (pathname?.startsWith("/routes/dashboard")) {
    return null;
  }

  return <Footer />;
}
