import Link from "next/link";
import { LogoInline } from "@/components/brand/logo";
import { SignOutButton } from "@/components/admin/sign-out-button";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
          <Link href="/admin/orders">
            <LogoInline />
          </Link>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">{children}</main>
    </div>
  );
}
