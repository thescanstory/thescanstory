import { Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function PreparingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Sparkles className="h-8 w-8 text-accent" />
      <h1 className="font-serif text-xl font-semibold text-primary sm:text-2xl">
        Your story is being prepared
      </h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        We haven&apos;t received your photo and video yet. Once they&apos;re
        in, this link will bring your story to life — check back soon.
      </p>
      <div className="mt-6">
        <Logo size="sm" />
      </div>
    </div>
  );
}
