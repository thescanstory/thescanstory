"use client";

import { useRouter } from "next/navigation";
import { PhotowallGame } from "@/components/experience/photowall-game";

const DEMO_HEADING = "Arav & Arya";
const DEMO_PHOTO_URL = "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop"; 

export default function DemoGamePage() {
  const router = useRouter();
  
  return (
    <PhotowallGame
      slug="demo"
      heading={DEMO_HEADING}
      photoUrl={DEMO_PHOTO_URL}
      onBackClick={() => router.push("/demo")}
    />
  );
}
