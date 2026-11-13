export type PropertyMedia = {
  id: string;
  url: string;
  caption: string | null;
  sort_order: number;
  is_cover: boolean;
};

export type Property = {
  id: string;
  reference_code: string;
  title: string;
  description: string | null;
  purpose: string;
  property_type: string;
  price: number;
  currency: string;
  area_value: number | null;
  area_unit: string;
  bedrooms: number | null;
  bathrooms: number | null;
  address: string | null;
  city: string;
  locality: string | null;
  status: string;
  is_published: boolean;
  assigned_agent_id: string | null;
  cover_url: string | null;
  media: PropertyMedia[];
  created_at: string;
  updated_at: string;
};

export type PropertyList = {
  items: Property[];
  total: number;
  page: number;
  page_size: number;
};

export const PURPOSES = ["sale", "rent"];
export const PROPERTY_TYPES = [
  "apartment",
  "house",
  "villa",
  "plot",
  "commercial",
  "office",
];
export const STATUSES = [
  "draft",
  "available",
  "reserved",
  "sold",
  "rented",
  "inactive",
];
export const AREA_UNITS = ["sqft", "sqm", "sqyd", "acre"];

export function label(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
