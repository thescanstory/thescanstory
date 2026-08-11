import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Play, Touchpad } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Logo } from "@/components/brand/logo";

export function MenuScreen({
  slug,
  heading,
  body,
  message,
  photoUrl,
}: {
  slug: string;
  heading: string;
  body: string;
  message: string;
  photoUrl: string;
}) {
  const router = useRouter();
  const [messageOpen, setMessageOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 py-8 text-center justify-between">
      {/* Upper Content Wrapper */}
      <div className="w-full flex flex-col items-center flex-1 justify-center max-w-sm">
        
        {/* Ornate Gold Frame with Portrait aspect ratio */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="gold-frame w-40 sm:w-44 aspect-[3/4] rounded-sm overflow-hidden"
        >
          <div className="gold-frame-mat h-full w-full">
            <div className="relative h-full w-full overflow-hidden bg-muted">
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Special Memory"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
        </motion.div>

        {/* Title / Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-6"
        >
          <h1 className="font-serif text-3xl font-bold tracking-tight text-primary">
            {heading || "Arav & Arya"}
          </h1>
          <p className="mt-1 text-sm font-medium tracking-wide text-muted-foreground">
            Our Special Digital Memories
          </p>
        </motion.div>

        {/* Button List (Matching Mockup Cards) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-8 w-full space-y-4"
        >
          {/* Card 1: Launch AR Scan Portal */}
          <button
            onClick={() => router.push(`/experience/${slug}`)}
            className="flex w-full items-center gap-4 rounded-2xl bg-white border border-secondary shadow-sm p-4 text-left hover:shadow-md transition-all active:scale-[0.98]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-accent border border-accent/20">
              <div className="relative">
                <Play className="h-4 w-4 fill-accent" />
                <span className="absolute -inset-1 border border-accent/40 rounded-sm scale-110 pointer-events-none" />
              </div>
            </span>
            <div>
              <span className="block text-sm font-bold uppercase tracking-wider text-primary">
                Launch AR Scan Portal
              </span>
            </div>
          </button>

          {/* Card 2: Our Special Message Portal */}
          <button
            onClick={() => setMessageOpen(true)}
            className="flex w-full items-center gap-4 rounded-2xl bg-white border border-secondary shadow-sm p-4 text-left hover:shadow-md transition-all active:scale-[0.98]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-accent border border-accent/20">
              <span className="h-6 w-6 rounded-md bg-accent/20 flex items-center justify-center">
                <Heart className="h-4 w-4 text-accent fill-accent" />
              </span>
            </span>
            <div>
              <span className="block text-sm font-bold uppercase tracking-wider text-primary">
                Our Special Message Portal
              </span>
              <span className="block text-xs font-semibold text-muted-foreground mt-0.5">
                From us, with love…
              </span>
            </div>
          </button>

          {/* Card 3: Tap-To-Reveal Photowall */}
          <button
            onClick={() => router.push(`/experience/${slug}/game`)}
            className="flex w-full items-center gap-4 rounded-2xl bg-white border border-secondary shadow-sm p-4 text-left hover:shadow-md transition-all active:scale-[0.98]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-accent border border-accent/20">
              <span className="h-6 w-6 rounded-md flex items-center justify-center border border-accent/20">
                <Touchpad className="h-4 w-4 text-accent" />
              </span>
            </span>
            <div>
              <span className="block text-sm font-bold uppercase tracking-wider text-primary">
                Tap-To-Reveal Photowall
              </span>
            </div>
          </button>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-10"
      >
        <Logo size="sm" />
      </motion.div>

      {/* Message Dialog in Notepad Theme */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="lined-paper relative px-6 py-12 text-center min-h-[360px] flex flex-col justify-center items-center">
            {/* Notepad Corner Hearts */}
            <Heart className="absolute top-4 left-4 h-6 w-6 text-accent fill-accent/80 -rotate-12" />
            <Heart className="absolute top-4 right-4 h-6 w-6 text-accent fill-accent/80 rotate-12" />
            <Heart className="absolute bottom-4 left-4 h-6 w-6 text-accent fill-accent/80 rotate-6" />
            <Heart className="absolute bottom-4 right-4 h-6 w-6 text-accent fill-accent/80 -rotate-6" />

            <DialogHeader className="mb-4">
              <DialogTitle className="font-serif text-2xl font-bold text-primary">
                Our Special Message
              </DialogTitle>
            </DialogHeader>
            
            <p className="whitespace-pre-wrap font-handwriting text-2xl leading-relaxed text-foreground max-w-xs">
              {body || message}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
