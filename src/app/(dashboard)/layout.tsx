import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/features/dashboard-sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex min-h-screen flex-1 flex-col p-4 pt-16 md:p-6 md:pt-6">
        {children}
      </main>
    </div>
  );
}
