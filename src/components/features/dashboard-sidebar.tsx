"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/features/sign-out-button";

interface NavItem {
  href: string;
  label: string;
  indent?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/products/search", label: "Search Product", indent: true },
  { href: "/products/new", label: "Add Product", indent: true },
  { href: "/contents", label: "Content Generator" },
  { href: "/library", label: "Library" },
  { href: "/schedules", label: "Schedules" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  function isActive(item: NavItem): boolean {
    if (item.href === "/") {
      return pathname === "/";
    }
    if (item.href === "/products") {
      return pathname === "/products" || pathname.startsWith("/products/");
    }
    if (item.href === "/schedules") {
      return pathname === "/schedules" || pathname.startsWith("/schedules/");
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <aside className="flex w-64 flex-col border-r bg-muted/30">
      <div className="p-4">
        <Link href="/" className="mb-6 block text-lg font-bold">
          Affiliator
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                isActive(item)
                  ? "bg-muted font-semibold text-foreground"
                  : "text-muted-foreground",
                item.indent && "ml-4"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <SignOutButton />
      </div>
    </aside>
  );
}
