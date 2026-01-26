// components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "./sidebar-provider";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Wallet,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Calendar,
  Star,
  Heart,
  User,
  Building,
  Plus,
  Bed,
  Crown,
  CreditCard,
  UserCheck,
  Building2,
  Megaphone,
  TrendingUp,
  Bell,
  X,
  DollarSign,
  Home, // 👈 Add this import
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  mockUser,
  getNavigationItems,
  UserRole,
} from "@/app/routes/dashboard/dashboard";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { toast } from "sonner";

// 👇 Add "Home" to the iconMap
export const iconMap = {
  LayoutDashboard,
  Calendar,
  User,
  Star,
  Heart,
  Building,
  Plus,
  Bed,
  BarChart3,
  Crown,
  CreditCard,
  Users,
  UserCheck,
  Building2,
  Megaphone,
  TrendingUp,
  Wallet,
  Settings,
  DollarSign,
  Home, // 👈 Add this
  Headphones,
};

export type IconName = keyof typeof iconMap;

export interface NavItem {
  name: string;
  href: string;
  icon: IconName;
}

// ... rest of your sidebar code remains the same
export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();
  const { user, setUser } = useUserStore();
  const navItems = user && getNavigationItems(user?.role as UserRole);
  const router = useRouter();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={toggle}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#fbf6ef] border-r border-HG-500/20",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex h-20 items-center p-4">
          <div className="w-full flex flex-col gap-1 pt-2 md:pt-0 md:flex-row md:justify-between items-start md:items-center">
            <Link href={"/"}>
              <p className="font-poppins select-none font-bold text-HG-500 text-xl md:text-3xl">
                SYPG
              </p>
            </Link>

            <Badge
              variant="outline"
              className="border-HG-500/50 md:border-2 md:py-1 text-HG-500 text-xs"
            >
              {user &&
                user?.role?.charAt(0).toUpperCase() +
                  user?.role?.slice(1) +
                  " Panel"}
            </Badge>
          </div>
          <X onClick={toggle} className="h-5 w-5 md:hidden cursor-pointer" />
        </div>

        <div className="flex flex-col pt-2">
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid gap-1 px-4">
              {navItems?.map((item, index) => {
                const IconComponent = iconMap[item.icon];
                return (
                  <Link
                    onClick={toggle}
                    key={index}
                    href={item.href}
                    className={cn(
                      "flex items-center font-inter gap-3 rounded-md px-4 py-4 text-sm font-medium transition-colors",
                      "hover:bg-HG-400/10",
                      pathname === item.href
                        ? "bg-HG-400/30 text-HG-500 hover:bg-HG-400/30"
                        : "text-muted-foreground"
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t-2 border-HG-400/20 my-2 mx-4" />

          <div>
            <nav className="grid py-2 gap-1 px-4">
              <div
                onClick={async () => {
                  const loadingToast = toast.loading("logging out...", {
                    closeButton: true,
                  });

                  const res = await axios.post("/api/auth/logout");
                  toast.dismiss(loadingToast);
                  if (res && res?.data && res?.data?.success) {
                    toast.dismiss(loadingToast);
                    setUser(null);
                    router.push("/");
                    toast.success(
                      res?.data?.message || "Logged out successfully.",
                      {
                        closeButton: true,
                        duration: 2000,
                      }
                    );
                  } else {
                    toast.dismiss(loadingToast);
                    toast.error(res.data?.message || "Failed to logout.", {
                      closeButton: true,
                      duration: 2000,
                    });
                  }
                }}
                className="flex cursor-pointer items-center gap-3 rounded-md px-4 py-4 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}