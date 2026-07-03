import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <div className="gradient-surface flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/60 bg-white/70 p-8 shadow-xl shadow-primary/10 backdrop-blur">
        <div className="mb-8 flex justify-center">
          <Logo size="md" />
        </div>
        <h1 className="mb-1 text-center text-lg font-semibold">Admin</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Sign in to continue
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
