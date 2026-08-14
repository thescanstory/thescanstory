"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoInline } from "@/components/brand/logo";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Package, Tag } from "lucide-react";

export function AdminHeader() {
  const pathname = usePathname();

  const navItems = [
    { name: "Orders", href: "/admin/orders", icon: Package },
    { name: "Products", href: "/admin/products", icon: Tag },
  ];

  return (
    <header className="glass sticky top-0 z-40 border-b border-white/40 shadow-sm shadow-primary/5 print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
        <div className="flex items-center gap-8">
          <Link href="/admin/orders">
            <LogoInline />
          </Link>
          <nav className="hidden md:flex items-center gap-1 bg-white/50 p-1 rounded-full border border-white/60">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-primary hover:bg-white/60"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <SignOutButton />
        </div>
      </div>
      {/* Mobile Nav */}
      <div className="md:hidden border-t border-white/40 px-4 py-2 flex items-center gap-2 bg-white/30 backdrop-blur-md">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex justify-center items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-primary hover:bg-white/60"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
