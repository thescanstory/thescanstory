"use client";

import { useRouter } from "next/navigation";
import { SinglePageStory } from "@/components/experience/single-page-story";

const DEMO_HEADING = "Arav & Arya";
const DEMO_BODY = "Happy Birthday, Arya!\n\nYou bring so much joy to everyone around you. Wishing you a wonderful day filled with love and laughter.\n\nYours always,\nArav";
const DEMO_PHOTO_URL = "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop";

export function DemoFlow() {
  const router = useRouter();

  return (
    <SinglePageStory
      slug="demo"
      heading={DEMO_HEADING}
      body={DEMO_BODY}
      photoUrl={DEMO_PHOTO_URL}
      onScanClick={() => router.push("/demo/ar")}
      onGameClick={() => router.push("/demo/game")}
    />
  );
}
