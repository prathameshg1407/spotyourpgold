"use server";
import type React from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { SidebarProvider } from "@/components/sidebar-provider";
import Footer from "@/components/Footer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Sidebar />
        <div className="lg:pl-72 flex-1 flex flex-col">
          <Header />
          <main className="px-4 md:px-6 pt-2 flex-1">{children}</main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
