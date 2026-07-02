"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExperienceLinkPanel({
  orderId,
  experienceSlug,
}: {
  orderId: string;
  experienceSlug: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/experience/${experienceSlug}`;
    navigator.clipboard.writeText(url);
    toast.success("Experience link copied");
  }

  async function regenerate() {
    setPending(true);
    const res = await fetch(`/api/admin/orders/${orderId}/regenerate-slug`, {
      method: "POST",
    });
    setPending(false);
    if (!res.ok) return toast.error("Failed to regenerate link");
    toast.success("Link regenerated — old link is now invalid");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <code className="rounded bg-muted px-2 py-1 text-xs">
        /experience/{experienceSlug}
      </code>
      <Button size="sm" variant="outline" onClick={copyLink}>
        <Copy className="mr-1.5 h-3.5 w-3.5" />
        Copy
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={regenerate}>
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        Regenerate
      </Button>
    </div>
  );
}
