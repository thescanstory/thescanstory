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
      {/* Ribbon bow */}
      <path
        d="M50 26 C50 26 44 10 32 12 C22 13.5 22 24 32 25.5 C40 26.5 50 26 50 26 Z"
        className="fill-primary/70"
      />
      <path
        d="M50 26 C50 26 56 10 68 12 C78 13.5 78 24 68 25.5 C60 26.5 50 26 50 26 Z"
        className="fill-primary/70"
      />
      <circle cx="50" cy="26" r="4.5" className="fill-primary" />

      {/* Outer frame (lighter tint) */}
      <rect
        x="14"
        y="30"
        width="72"
        height="96"
        rx="6"
        className="stroke-primary/45"
        strokeWidth="6"
      />

      {/* Inner frame, split top/bottom around the play button */}
      <path
        d="M28 44 H72 V70"
        className="stroke-primary"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M28 44 V112 H72 V86"
        className="stroke-primary"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Play button */}
      <circle cx="66" cy="78" r="19" className="fill-accent" />
      <path d="M60 69 L78 78 L60 87 Z" className="fill-white" />
    </svg>
  );
}
