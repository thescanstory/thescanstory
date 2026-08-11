import { cn } from "@/lib/utils";

// Gift-box-with-play-button mark, recreated from the brand reference —
// a framed box (the "gift"/frame) with a play triangle at its center seam,
// topped with a ribbon bow. Two-tone: --primary for the inner line work,
// a lighter tint for the outer frame, matching the brand reference.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 132"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
      aria-hidden="true"
    >
      {/* Ribbon bow in primary (maroon) */}
      <path
        d="M50 26 C50 26 44 8 32 10 C22 11.5 22 22 32 23.5 C40 24.5 50 26 50 26 Z"
        className="fill-primary"
      />
      <path
        d="M50 26 C50 26 56 8 68 10 C78 11.5 78 22 68 23.5 C60 24.5 50 26 50 26 Z"
        className="fill-primary"
      />
      <circle cx="50" cy="26" r="4.5" className="fill-primary" />

      {/* Outer frame in accent (pink) */}
      <rect
        x="14"
        y="30"
        width="72"
        height="96"
        rx="6"
        className="stroke-accent"
        strokeWidth="6"
      />

      {/* Inner frame in primary (maroon) */}
      <path
        d="M26 46 H74 V72 M60 72 H46"
        className="stroke-primary"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M26 46 V110 H74 V84 M60 84 H46"
        className="stroke-primary"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Play button in accent (pink) */}
      <path
        d="M48 68 C46 66.5 44 68 44 71.5 V84.5 C44 88 46 89.5 48 88 L58 81.5 C60 80 60 76 58 74.5 Z"
        className="fill-accent"
      />
    </svg>
  );
}
