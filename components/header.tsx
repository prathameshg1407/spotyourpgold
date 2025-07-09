"use client";

import { useSidebar } from "./sidebar-provider";
import { Menu } from "lucide-react";

import { mockUser } from "@/app/routes/dashboard/dashboard";

export function Header() {
  const { toggle } = useSidebar();
  const user = mockUser;

  return (
    <header className="sticky top-0 z-40  md:hidden  ">
      <div className="flex h-16  items-center px-4 pt-2 gap-4">
        <div className="md:hidden bg-[#f6eddf] p-3 rounded-xl" onClick={toggle}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </div>
      </div>
    </header>
  );
}
