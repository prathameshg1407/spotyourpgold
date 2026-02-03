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
  Home,
  Headphones,
  Shield,
  FileText,  // ✅ Added FileText icon
  Award,     // ✅ Added Award icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getNavigationItems,
  UserRole,
} from "@/app/routes/dashboard/dashboard";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { toast } from "sonner";

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
  Home,
  Headphones,
  Shield,
  FileText,  // ✅ Added FileText to iconMap
  Award,     // ✅ Added Award to iconMap
};

export type IconName = keyof typeof iconMap;

export interface NavItem {
  name: string;
  href: string;
  icon: IconName;
}

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();
  const { user, setUser } = useUserStore();
  const navItems = user && getNavigationItems(user?.role as UserRole);
  const router = useRouter();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={toggle}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#fbf6ef] border-r border-HG-500/20",
          "transition-transform duration-300 ease-in-out",
          "flex flex-col h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        {/* Header - Fixed height, won't shrink */}
        <div className="flex h-20 items-center p-4 shrink-0">
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

        {/* Main content area - flex-1 to take remaining space, min-h-0 is crucial! */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Scrollable navigation area */}
          <div className="flex-1 overflow-y-auto py-2">
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
                    <IconComponent className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer - Fixed at bottom, won't shrink */}
          <div className="shrink-0">
            <div className="border-t-2 border-HG-400/20 my-2 mx-4" />
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