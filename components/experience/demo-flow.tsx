"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/experience/screens/splash-screen";
import { FrameRevealScreen } from "@/components/experience/screens/frame-reveal-screen";
import { SpecialMessageScreen } from "@/components/experience/screens/special-message-screen";
import { MenuScreen } from "@/components/experience/screens/menu-screen";

type Screen = "splash" | "frame" | "message" | "menu";

const DEMO_HEADING = "Arav & Arya";
const DEMO_BODY = "Happy Birthday, Arya!\n\nYou bring so much joy to everyone around you. Wishing you a wonderful day filled with love and laughter.\n\nYours always,\nArav";
const DEMO_PHOTO_URL = "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop"; 

export function DemoFlow() {
  const [screen, setScreen] = useState<Screen>("splash");
  const router = useRouter();

  if (screen === "splash") {
    return <SplashScreen onDone={() => setScreen("frame")} />;
  }

  if (screen === "frame") {
    return (
      <FrameRevealScreen
        photoUrl={DEMO_PHOTO_URL}
        heading={DEMO_HEADING}
        onDone={() => setScreen("message")}
      />
    );
  }

  if (screen === "message") {
    return (
      <SpecialMessageScreen body={DEMO_BODY} onDone={() => setScreen("menu")} />
    );
  }

  return (
    <MenuScreen
      slug="demo"
      heading={DEMO_HEADING}
      body={DEMO_BODY}
      message={DEMO_BODY}
      photoUrl={DEMO_PHOTO_URL}
      onScanClick={() => router.push("/demo/ar")}
      onGameClick={() => router.push("/demo/game")}
    />
  );
}
