import Link from "next/link";
import { LogoInline } from "@/components/brand/logo";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-40 border-b border-white/40 shadow-sm shadow-primary/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:py-4">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <LogoInline />
          </Link>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/40 bg-white/40 py-6 text-center text-sm text-muted-foreground backdrop-blur">
        The Scan Story — a physical object that comes to life.
      </footer>
    </div>
  );
}
