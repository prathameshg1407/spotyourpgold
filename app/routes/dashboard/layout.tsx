'use server'
import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { SidebarProvider } from "@/components/sidebar-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-72">
          <Header />
          <main className="px-4 md:px-6 pt-2">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
