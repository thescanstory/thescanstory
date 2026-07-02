import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

export function Logo({
  className,
  markClassName,
  size = "md",
}: {
  className?: string;
  markClassName?: string;
  size?: "sm" | "md" | "lg";
}) {
  const markSize = { sm: "h-8 w-auto", md: "h-11 w-auto", lg: "h-16 w-auto" }[size];
  const textSize = { sm: "text-xs", md: "text-sm", lg: "text-lg" }[size];

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <LogoMark className={cn(markSize, markClassName)} />
      <span
        className={cn(
          "font-serif font-semibold uppercase tracking-wide text-primary text-center leading-tight",
          textSize
        )}
      >
        The Scan
        <br />
        Story
      </span>
    </div>
  );
}

export function LogoInline({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark className="h-8 w-auto" />
      <span className="font-serif text-lg font-semibold tracking-wide text-primary">
        The Scan Story
      </span>
    </div>
  );
}
