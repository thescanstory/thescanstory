import { z } from "zod";

export const shippingSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  addressLine: z.string().trim().min(5, "Address is required").max(300),
  city: z.string().trim().min(2, "City is required").max(120),
  pin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
  email: z.string().trim().email("Enter a valid email"),
});
export type ShippingInput = z.infer<typeof shippingSchema>;

export const messageSchema = z.object({
  textContent: z
    .string()
    .trim()
    .min(1, "Write a short message")
    .max(1000, "Keep it under 1000 characters"),
});
export type MessageInput = z.infer<typeof messageSchema>;

export const otpVerifySchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
export const MAX_VIDEO_DURATION_SECONDS = 60;
export const MIN_TARGET_PHOTO_DIMENSION = 1000; // px, both width and height

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  price_paise: z.number().int().min(0, "Price must be positive"),
  image_url: z.string().trim().url().optional().nullable().or(z.literal("")),
  type: z.enum(["frame", "wallet_card", "tshirt"]),
});
export type ProductInput = z.infer<typeof productSchema>;
