import Link from "next/link";
import { formatPrice, label } from "@/lib/properties";
import { imageSrc, type PublicProperty } from "@/lib/public";

export default function PropertyCard({ p }: { p: PublicProperty }) {
  const src = imageSrc(p.cover_url);
  const facts = [
    label(p.property_type),
    p.bedrooms != null ? `${p.bedrooms} bed` : null,
    p.bathrooms != null ? `${p.bathrooms} bath` : null,
    p.area_value != null ? `${p.area_value} ${p.area_unit}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <Link
      href={`/listings/${p.id}`}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={p.title} className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-400">
          No image
        </div>
      )}
      <div className="p-4">
        <div className="mb-2 flex gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            For {p.purpose}
          </span>
          {p.status === "reserved" && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Reserved
            </span>
          )}
        </div>
        <h3 className="font-semibold text-slate-900">{p.title}</h3>
        <p className="text-sm text-slate-500">
          {[p.locality, p.city].filter(Boolean).join(", ")}
        </p>
        <p className="mt-2 text-lg font-semibold text-slate-900">
          {formatPrice(p.price, p.currency)}
        </p>
        <p className="mt-1 text-xs text-slate-500">{facts}</p>
      </div>
    </Link>
  );
}
