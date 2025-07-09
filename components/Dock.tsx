"use client";
import React from "react";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconHeart,
  IconHeartFilled,
  IconHome,
  IconHomeFilled,
  IconUser,
  IconUserFilled,
} from "@tabler/icons-react";

import { usePathname } from "next/navigation";

export function Dock() {
  const pathname = usePathname();

  const links = [
    {
      title: "Home",
      icon:
        pathname === "/" ? (
          <IconHomeFilled className="h-full w-full text-HG-400 " />
        ) : (
          <IconHome className="h-full w-full text-HG-400" />
        ),
      href: "/",
    },

    {
      title: "Watchlist",
      icon:
        pathname === "/routes/watchlist" ? (
          <IconHeartFilled className="h-full w-full text-HG-400 " />
        ) : (
          <IconHeart className="h-full w-full text-HG-400" />
        ),
      href: "/routes/watchlist",
    },
    {
      title: "Be A Roomie",
      icon:
        pathname === "/routes/be-a-roomie" ? (
          <IconUserFilled className="h-full w-full text-HG-400 " />
        ) : (
          <IconUser className="h-full w-full text-HG-400" />
        ),
      href: "/routes/be-a-roomie",
    },
    // {
    //   title: "For Owners",
    //   icon:
    //     pathname === "/pages/owners" ? (
    //       <IconClipboardTextFilled className="h-full w-full text-HG-400 " />
    //     ) : (
    //       <IconClipboardText className="h-full w-full text-HG-400" />
    //     ),
    //   href: "/pages/owners",
    // },
  ];
  return (
    <div className="flex items-center justify-center   w-full">
      <FloatingDock items={links} />
    </div>
  );
}
