import { useEffect } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";

const AUTO_ADVANCE_MS = 3200;

export function FrameRevealScreen({
  photoUrl,
  heading,
  onDone,
}: {
  photoUrl: string;
  heading: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Continue"
      className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="gold-frame w-full max-w-[300px] aspect-[3/4] rounded-sm overflow-hidden"
      >
        <div className="gold-frame-mat h-full w-full relative">
          <div className="relative h-full w-full overflow-hidden bg-muted">
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Your photo" className="h-full w-full object-cover" />
            )}

            {/* Torn paper overlay at the bottom with heading and logo */}
            <div className="torn-edge absolute bottom-0 left-0 right-0 bg-background pt-6 pb-4 px-4 flex flex-col justify-end items-center min-h-[90px]">
              <p className="text-center font-serif text-2xl font-bold tracking-tight text-primary">
                {heading}
              </p>
              <div className="absolute right-3 bottom-2 opacity-60 scale-75 transform origin-bottom-right">
                <Logo size="sm" className="gap-0" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </button>
  );
}
