"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut, Maximize } from "lucide-react";

export function PhotoCarousel({
  ids,
  open,
  onOpenChange,
}: {
  ids: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [previews, setPreviews] = useState<{ orderId: string; url: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (open && ids.length > 0) {
      setLoading(true);
      setCurrentIndex(0);
      setScale(1);
      setRotation(0);
      fetch("/api/admin/orders/preview-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
        .then((res) => res.json())
        .then((data) => {
          setPreviews(data.previews || []);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [open, ids]);

  const currentPreview = previews[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % previews.length);
    setScale(1);
    setRotation(0);
  };
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + previews.length) % previews.length);
    setScale(1);
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 text-white border-white/10">
        <div className="sr-only">
          <DialogTitle>Photo Preview</DialogTitle>
          <DialogDescription>Carousel for target photos</DialogDescription>
        </div>
        
        {loading ? (
          <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : previews.length === 0 ? (
          <div className="flex h-[80vh] items-center justify-center">
            <p className="text-white/50">No photos found for selected orders.</p>
          </div>
        ) : (
          <div className="relative flex h-[80vh] flex-col">
            {/* Toolbar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-black/50 p-4 backdrop-blur">
              <div className="text-sm font-medium">
                Order: <span className="font-mono text-primary/80">{currentPreview?.orderId.slice(0, 8)}</span>
                <span className="ml-4 text-white/50">
                  {currentIndex + 1} / {previews.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setScale(1)} className="text-white hover:bg-white/20">
                  <Maximize className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.5))} className="text-white hover:bg-white/20">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.min(3, s + 0.5))} className="text-white hover:bg-white/20">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setRotation((r) => r - 90)} className="text-white hover:bg-white/20">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Viewport */}
            <div className="relative flex-1 overflow-auto flex items-center justify-center p-8 cursor-grab active:cursor-grabbing">
              {currentPreview?.url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={currentPreview.url}
                  alt={`Photo for order ${currentPreview.orderId}`}
                  className="max-w-full transition-transform duration-200"
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                  draggable={false}
                />
              ) : (
                <p className="text-white/50">No photo uploaded for this order</p>
              )}
            </div>

            {/* Navigation */}
            {previews.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-white/20 backdrop-blur"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-white/20 backdrop-blur"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
