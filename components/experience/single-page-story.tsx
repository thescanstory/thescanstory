"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ScanLine, Grid3X3, ArrowRight, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/brand/logo";

function MenuButton({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-white/60 p-4 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:translate-y-0 active:scale-[0.98]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold tracking-tight text-primary">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-primary/60">{subtitle}</p>}
      </div>
      <ArrowRight className="h-5 w-5 text-primary/20 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

export function SinglePageStory({
  photoUrl,
  heading,
  body,
  slug,
  onScanClick,
  onGameClick,
  showShopButton,
}: {
  photoUrl: string;
  heading: string;
  body: string;
  slug: string;
  onScanClick?: () => void;
  onGameClick?: () => void;
  showShopButton?: boolean;
}) {
  const router = useRouter();

  const handleScan = () => {
    if (onScanClick) onScanClick();
    else router.push(`/experience/${slug}/ar`);
  };

  const handleGame = () => {
    if (onGameClick) onGameClick();
    else router.push(`/experience/${slug}/game`);
  };

  return (
    <div className="min-h-screen w-full bg-background pb-24">
      {/* 1. Header / Logo */}
      <div className="pt-12 pb-8 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Logo size="lg" />
        </motion.div>
      </div>

      {/* 2. Frame Reveal (Hero) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        className="px-6 flex justify-center"
      >
        <div className="gold-frame w-full max-w-[320px] aspect-[3/4] rounded-sm overflow-hidden shadow-2xl">
          <div className="gold-frame-mat h-full w-full relative">
            <div className="relative h-full w-full overflow-hidden bg-muted">
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Your photo" className="h-full w-full object-cover" />
              )}
              {/* Torn paper overlay at the bottom with heading */}
              <div className="torn-edge absolute bottom-0 left-0 right-0 bg-background pt-8 pb-6 px-4 flex flex-col justify-end items-center min-h-[100px]">
                <p className="text-center font-serif text-3xl font-bold tracking-tight text-primary">
                  {heading}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Special Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-12 px-6 max-w-md mx-auto"
      >
        <div className="rounded-2xl bg-white/40 p-8 shadow-sm backdrop-blur-sm border border-white/60">
          <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-primary/90 text-center">
            {body}
          </p>
        </div>
      </motion.div>

      {/* 4. Action Menu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-12 px-6 max-w-sm mx-auto flex flex-col gap-4"
      >
        <h2 className="text-center font-serif text-xl text-primary/80 mb-2">Explore More</h2>
        <MenuButton 
          icon={ScanLine} 
          title="LAUNCH AR SCAN PORTAL" 
          subtitle="Bring your photo to life"
          onClick={handleScan} 
        />
        <MenuButton 
          icon={Grid3X3} 
          title="TAP-TO-REVEAL PHOTOWALL" 
          subtitle="Discover hidden memories"
          onClick={handleGame} 
        />
        {showShopButton && (
          <div className="mt-4 border-t border-primary/10 pt-6">
            <h2 className="text-center font-serif text-xl text-primary/80 mb-4">Want Your Own?</h2>
            <MenuButton 
              icon={ShoppingBag}
              title="CREATE YOUR OWN" 
              subtitle="Turn your photo into a memory"
              onClick={() => {
                document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
              }} 
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
