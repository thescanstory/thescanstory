import { AdminHeader } from "@/components/admin/admin-header";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminHeader />
      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
