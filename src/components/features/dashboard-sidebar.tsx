"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/features/sign-out-button";
import { Menu, X } from "lucide-react";

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
  { href: "/riddles", label: "Riddles" },
  { href: "/library", label: "Library" },
  { href: "/schedules", label: "Schedules" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function isActive(item: NavItem): boolean {
    if (item.href === "/") return pathname === "/";
    if (item.href === "/products")
      return pathname === "/products" || pathname.startsWith("/products/");
    if (item.href === "/schedules")
      return pathname === "/schedules" || pathname.startsWith("/schedules/");
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 md:hidden"
        aria-label="Toggle menu"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform md:relative md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
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
    </>
  );
}
