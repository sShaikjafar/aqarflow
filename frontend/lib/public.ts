import { API_URL } from "@/lib/auth";
import { MEDIA_BASE } from "@/lib/api";

export type PublicMedia = {
  id: string;
  url: string;
  caption: string | null;
  is_cover: boolean;
};

export type PublicProperty = {
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
  city: string;
  locality: string | null;
  status: string;
  cover_url: string | null;
  media: PublicMedia[];
};

export type PublicPropertyList = {
  items: PublicProperty[];
  total: number;
  page: number;
  page_size: number;
};

export async function publicFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const data = await res.json();
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail))
        message = data.detail
          .map((d: { msg: string }) => d.msg.replace("Value error, ", ""))
          .join(". ");
    } catch {
      // keep the default message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function imageSrc(url: string | null): string | null {
  return url ? `${MEDIA_BASE}${url}` : null;
}
