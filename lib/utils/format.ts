import { format } from "date-fns";

export function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function formatDate(iso: string) {
  return format(new Date(iso), "d MMM yyyy, h:mm a");
}
