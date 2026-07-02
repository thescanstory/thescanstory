import Papa from "papaparse";
import type { Json } from "@/types/database.types";

type ShippingAddress = {
  name?: string;
  addressLine?: string;
  city?: string;
  pin?: string;
};

export function ordersToShippingCsv(
  orders: Array<{
    id: string;
    phone: string;
    shipping_address: Json;
    products: { name: string } | null;
  }>
) {
  const rows = orders.map((order) => {
    const address = (order.shipping_address ?? {}) as ShippingAddress;
    return {
      "Order ID": order.id,
      Name: address.name ?? "",
      "Address Line": address.addressLine ?? "",
      City: address.city ?? "",
      PIN: address.pin ?? "",
      Phone: order.phone,
      Product: order.products?.name ?? "",
    };
  });

  return Papa.unparse(rows);
}
