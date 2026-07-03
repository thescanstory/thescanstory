"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResendNotificationButton({ orderId }: { orderId: string }) {
  const [pending, setPending] = useState(false);

  async function resend() {
    setPending(true);
    const res = await fetch(`/api/admin/orders/${orderId}/resend-notification`, {
      method: "POST",
    });
    setPending(false);
    if (!res.ok) return toast.error("Failed to resend notification");
    toast.success("Experience link sent again (see server console for stub/real send)");
  }

  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={resend}>
      <Send className="mr-1.5 h-3.5 w-3.5" />
      Resend notification
    </Button>
  );
}
