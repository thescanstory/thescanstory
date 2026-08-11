"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { shippingSchema, type ShippingInput } from "@/lib/validation/schemas";
import { formatPaise } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { DEMO_SHIPPING, finalizeOrder, submitOnlineOrder } from "@/lib/checkout/place-order";

type PaymentMethod = "online" | "cod";
type Step = "form" | "cod-otp" | "processing";

export function CheckoutFlow({
  productId,
  productName,
  pricePaise,
  codHandlingFeePaise,
}: {
  productId: string;
  productName: string;
  pricePaise: number;
  codHandlingFeePaise: number;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [step, setStep] = useState<Step>("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockBanner, setMockBanner] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<ShippingInput>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { name: "", addressLine: "", city: "", pin: "", phone: "", email: "" },
  });

  useEffect(() => {
    const sid = localStorage.getItem(`scan-story-session-${productId}`);
    setSessionId(sid);
    
    if (sid) {
      fetch(`/api/session/${sid}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.photo?.previewUrl) {
            setPreviewUrl(data.photo.previewUrl);
          }
        })
        .catch(() => {});
    }
  }, [productId]);

  const total =
    pricePaise + (paymentMethod === "cod" ? codHandlingFeePaise : 0);

  function handleOrderResult(result: { orderId: string } | { error: string }) {
    if ("error" in result) {
      setError(result.error);
      setStep("form");
      return;
    }
    localStorage.removeItem(`scan-story-session-${productId}`);
    router.push(`/order-confirmation/${result.orderId}`);
  }

  async function handleDemoSkip() {
    setError(null);
    form.reset(DEMO_SHIPPING);
    setPaymentMethod("online");
    setStep("processing");
    try {
      const result = await submitOnlineOrder({
        sessionId,
        productId,
        shipping: DEMO_SHIPPING,
        onMockDelay: () => setMockBanner(true),
      });
      handleOrderResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("form");
    }
  }

  async function handleSendOtp() {
    setError(null);
    const phone = form.getValues("phone");
    const phoneCheck = shippingSchema.shape.phone.safeParse(phone);
    if (!phoneCheck.success) {
      form.setError("phone", { message: phoneCheck.error.issues[0]?.message });
      return;
    }

    const res = await fetch("/api/checkout/cod/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, phone }),
    });
    if (res.ok) setOtpSent(true);
  }

  async function handleVerifyOtp() {
    setError(null);
    const phone = form.getValues("phone");
    const res = await fetch("/api/checkout/cod/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, phone, code: otpCode }),
    });
    if (res.ok) {
      setOtpVerified(true);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Verification failed");
    }
  }

  async function onSubmit() {
    setError(null);

    try {
      if (paymentMethod === "cod") {
        if (!otpVerified) {
          setStep("cod-otp");
          return;
        }
        setStep("processing");
        const result = await finalizeOrder({
          sessionId,
          productId,
          paymentMethod: "cod",
          shipping: form.getValues(),
        });
        handleOrderResult(result);
        return;
      }

      setStep("processing");
      const result = await submitOnlineOrder({
        sessionId,
        productId,
        shipping: form.getValues(),
        onMockDelay: () => setMockBanner(true),
      });
      handleOrderResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("form");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {sessionId === null && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            We couldn&apos;t find your upload session. Please go back and
            upload your photo, video, and message first.
          </div>
        )}

        {sessionId && (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
            <p className="text-sm text-muted-foreground">
              Just want to see the AR experience? Skip typing the form.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={step === "processing"}
              onClick={handleDemoSkip}
            >
              Skip Checkout (Demo)
            </Button>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Shipping details</h2>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="addressLine"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Payment method</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("online")}
              className={cn(
                "rounded-xl border bg-white/60 p-4 text-left shadow-sm transition-all",
                paymentMethod === "online"
                  ? "border-primary bg-gradient-to-br from-secondary to-white shadow-glow ring-1 ring-primary"
                  : "hover:border-primary/30 hover:shadow-md"
              )}
            >
              <p className="font-medium">Pay Online</p>
              <p className="text-sm text-muted-foreground">Razorpay (test mode)</p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cod")}
              className={cn(
                "rounded-xl border bg-white/60 p-4 text-left shadow-sm transition-all",
                paymentMethod === "cod"
                  ? "border-primary bg-gradient-to-br from-secondary to-white shadow-glow ring-1 ring-primary"
                  : "hover:border-primary/30 hover:shadow-md"
              )}
            >
              <p className="font-medium">Cash on Delivery</p>
              <p className="text-sm text-muted-foreground">
                +{formatPaise(codHandlingFeePaise)} handling fee
              </p>
            </button>
          </div>
        </section>

        {step === "cod-otp" && !otpVerified && (
          <section className="space-y-3 rounded-lg border p-4">
            <p className="text-sm">
              Verify your phone number to confirm this COD order.
            </p>
            {!otpSent ? (
              <Button type="button" onClick={handleSendOtp}>
                Send verification code
              </Button>
            ) : (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="otp-code">6-digit code</Label>
                  <Input
                    id="otp-code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    placeholder="123456"
                  />
                </div>
                <Button type="button" onClick={handleVerifyOtp}>
                  Verify
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Dev mode: the code is always 123456 (check server console).
            </p>
          </section>
        )}

        {otpVerified && (
          <p className="text-sm text-primary">Phone verified — ready to place your order.</p>
        )}

        {mockBanner && (
          <div className="rounded-lg border border-primary bg-muted p-4 text-sm">
            Test Mode — Simulated Payment. No real Razorpay keys configured yet;
            this order will be marked paid automatically.
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="rounded-xl border bg-slate-50 p-4">
          <h2 className="text-lg font-medium mb-4">Order Summary</h2>
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-white shadow-sm shrink-0">
              {previewUrl ? (
                <Image src={previewUrl} alt="Your uploaded photo" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground text-center px-1">
                  No photo
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-medium text-primary">{productName}</p>
              <p className="text-sm text-muted-foreground">With custom AR video message</p>
              {paymentMethod === "cod" && (
                <p className="text-xs text-muted-foreground mt-2">
                  + {formatPaise(codHandlingFeePaise)} COD handling fee
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="gradient-text text-xl font-semibold">{formatPaise(total)}</p>
          </div>
          <Button type="submit" size="lg" disabled={step === "processing" || !sessionId}>
            {step === "processing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : paymentMethod === "cod" && !otpVerified && otpSent ? (
              "Verify code above"
            ) : (
              "Place Order"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
