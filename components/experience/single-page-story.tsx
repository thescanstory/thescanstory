"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ScanLine, Grid3X3, ShoppingBag, Mail, ArrowLeft, Heart } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

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
      className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-white/70 p-4 text-left shadow-[0_4px_20px_rgb(0,0,0,0.03)] backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:translate-y-0 active:scale-[0.98]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium tracking-wide text-primary">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-primary/70">{subtitle}</p>}
      </div>
    </button>
  );
}

type Step = "loading" | "frame" | "message" | "menu" | "portal";

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
  const [step, setStep] = useState<Step>("loading");

  useEffect(() => {
    const visitedKey = `scan-story-visited-${slug}`;
    const hasVisited = localStorage.getItem(visitedKey);
    if (hasVisited === "true") {
      setStep("menu");
    } else {
      setStep("frame");
    }
  }, [slug]);

  const handleNextToMessage = () => {
    setStep("message");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextToMenu = () => {
    const visitedKey = `scan-story-visited-${slug}`;
    localStorage.setItem(visitedKey, "true");
    setStep("menu");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScan = () => {
    if (onScanClick) onScanClick();
    else router.push(`/experience/${slug}/ar`);
  };

  const handleGame = () => {
    if (onGameClick) onGameClick();
    else router.push(`/experience/${slug}/game`);
  };

  if (step === "loading") {
    return <div className="min-h-screen w-full bg-background" />;
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background relative overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        
        {/* FRAME REVEAL SCREEN */}
        {(step === "frame") && (
          <motion.div
            key="frame-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 flex flex-col relative h-[100dvh] overflow-y-auto"
          >
            {/* Top Pink Section with Frame */}
            <div className="flex-1 flex flex-col items-center justify-center py-10 z-10 px-6 min-h-[50vh]">
              <div className="gold-frame w-full max-w-[280px] sm:max-w-[320px] aspect-[3/4] rounded-sm overflow-hidden shadow-2xl bg-muted relative">
                <div className="gold-frame-mat h-full w-full relative">
                  <div className="relative h-full w-full overflow-hidden bg-white">
                    {photoUrl && (
                      <Image src={photoUrl} alt="Your photo" fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 320px" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom White Torn Paper Section */}
            <div className="relative bg-white pt-10 pb-12 px-6 flex flex-col items-center justify-start shrink-0">
              <div className="torn-edge absolute top-0 left-0 right-0 h-6 bg-white z-20 -translate-y-full" />
              
              <h1 className="text-center font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground mt-4 mb-8">
                {heading}
              </h1>
              
              <Button onClick={handleNextToMessage} size="lg" className="w-full max-w-[280px] shadow-glow">
                Tap to open
              </Button>

              {/* Bottom Right Logo */}
              <div className="mt-8 flex justify-end w-full max-w-[280px]">
                <div className="opacity-80 scale-75 origin-bottom-right">
                  <Logo size="sm" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* MESSAGE SCREEN */}
        {(step === "message" || step === "portal") && (
          <motion.div
            key="message-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 lined-paper p-6 pt-16 flex flex-col overflow-y-auto h-[100dvh]"
          >
            {/* Scattered Decorative Hearts */}
            <Heart className="absolute top-[5%] left-[8%] text-red-700/80 fill-red-700/80 w-6 h-6 -rotate-12" />
            <Heart className="absolute top-[12%] right-[10%] text-red-700/80 fill-red-700/80 w-8 h-8 rotate-12" />
            <Heart className="absolute top-[35%] left-[4%] text-red-700/80 fill-red-700/80 w-5 h-5 -rotate-6" />
            <Heart className="absolute top-[60%] right-[6%] text-red-700/80 fill-red-700/80 w-7 h-7 rotate-45" />
            <Heart className="absolute bottom-[20%] left-[12%] text-red-700/80 fill-red-700/80 w-8 h-8 -rotate-12" />
            <Heart className="absolute bottom-[10%] right-[10%] text-red-700/80 fill-red-700/80 w-6 h-6 rotate-12" />

            <div className="max-w-md mx-auto w-full flex-1 flex flex-col relative z-10 min-h-full">
              <div className="flex-1 text-center font-handwriting text-3xl sm:text-4xl leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {body}
              </div>
              
              <div className="mt-12 mb-8 flex flex-col items-center gap-4 shrink-0">
                {step === "message" && (
                  <Button onClick={handleNextToMenu} size="lg" className="w-full max-w-[280px] shadow-glow">
                    Continue to Menu
                  </Button>
                )}
                {step === "portal" && (
                  <Button variant="default" onClick={() => { setStep("menu"); window.scrollTo({ top: 0, behavior: "smooth" }); }} size="lg" className="w-full max-w-[280px] shadow-glow">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* MAIN MENU SCREEN */}
        {step === "menu" && (
          <motion.div
            key="menu-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="flex-1 flex flex-col px-6 py-10 max-w-sm mx-auto w-full relative z-10 h-[100dvh] overflow-y-auto"
          >
            {/* Header: Small Frame and Titles */}
            <div className="flex flex-col items-center mb-10 shrink-0 mt-4">
              <div className="gold-frame w-24 h-32 rounded-sm overflow-hidden shadow-lg bg-muted mb-6">
                <div className="gold-frame-mat h-full w-full relative">
                  <div className="relative h-full w-full overflow-hidden bg-white">
                    {photoUrl && (
                      <Image src={photoUrl} alt="Your photo" fill priority className="object-cover" sizes="120px" />
                    )}
                  </div>
                </div>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-1 text-center">
                {heading}
              </h1>
              <p className="text-xs sm:text-sm text-foreground/80 font-medium text-center">
                Our Special Digital Memories
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-4 mb-8 shrink-0">
              <MenuButton 
                icon={ScanLine} 
                title="LAUNCH AR SCAN PORTAL" 
                onClick={handleScan} 
              />
              
              <MenuButton 
                icon={Mail} 
                title="OUR SPECIAL MESSAGE PORTAL" 
                subtitle="From us, with love..."
                onClick={() => { setStep("portal"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
              />

              <MenuButton 
                icon={Grid3X3} 
                title="TAP-TO-REVEAL PHOTOWALL" 
                onClick={handleGame} 
              />
              
              {showShopButton && (
                <MenuButton 
                  icon={ShoppingBag}
                  title="CREATE YOUR OWN" 
                  subtitle="Turn your photo into a memory"
                  onClick={() => {
                    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
                  }} 
                />
              )}
            </div>

            {/* Bottom Logo */}
            <div className="mt-auto flex justify-center opacity-80 pb-6 shrink-0 pt-4">
              <Logo size="sm" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
