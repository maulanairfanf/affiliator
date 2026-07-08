import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

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
      <aside className="w-64 border-r bg-muted/30 p-4">
        <nav className="space-y-2">
          <a href="/products" className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
            Products
          </a>
          <a href="/contents" className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
            Content Generator
          </a>
          <a href="/library" className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
            Library
          </a>
          <a href="/schedules" className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
            Schedules
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
