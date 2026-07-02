import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
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
