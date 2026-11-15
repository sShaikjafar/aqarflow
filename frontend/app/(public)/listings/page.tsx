"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PropertyCard from "@/components/public/PropertyCard";
import Skeleton from "@/components/ui/Skeleton";
import { PROPERTY_TYPES, label } from "@/lib/properties";
import { publicFetch, type PublicPropertyList } from "@/lib/public";

const inputClass =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600";

function Listings() {
  const router = useRouter();
  const sp = useSearchParams();

  const q = sp.get("q") ?? "";
  const purpose = sp.get("purpose") ?? "";
  const type = sp.get("type") ?? "";
  const city = sp.get("city") ?? "";
  const bedrooms = sp.get("bedrooms") ?? "";
  const minPrice = sp.get("min") ?? "";
  const maxPrice = sp.get("max") ?? "";
  const sort = sp.get("sort") ?? "newest";
  const page = Math.max(1, Number(sp.get("page") ?? "1") || 1);

  const [text, setText] = useState(q);
  const [data, setData] = useState<PublicPropertyList | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function update(changes: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(changes).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    if (!("page" in changes)) params.delete("page");
    router.replace(`/listings?${params.toString()}`);
  }

  useEffect(() => {
    publicFetch<string[]>("/public/cities").then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (text !== q) update({ q: text.trim() });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), page_size: "9", sort });
    if (q) params.set("q", q);
    if (purpose) params.set("purpose", purpose);
    if (type) params.set("property_type", type);
    if (city) params.set("city", city);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    publicFetch<PublicPropertyList>(`/public/properties?${params.toString()}`)
      .then((d) => active && setData(d))
      .catch((e: Error) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [q, purpose, type, city, bedrooms, minPrice, maxPrice, sort, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  const hasFilters = q || purpose || type || city || bedrooms || minPrice || maxPrice;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Properties</h1>
      <p className="mt-1 text-slate-500">
        Search and filter our available properties.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          aria-label="Search"
          placeholder="Search title or area..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={inputClass}
        />
        <select
          aria-label="Buy or rent"
          value={purpose}
          onChange={(e) => update({ purpose: e.target.value })}
          className={inputClass}
        >
          <option value="">Buy or rent</option>
          <option value="sale">For sale</option>
          <option value="rent">For rent</option>
        </select>
        <select
          aria-label="Property type"
          value={type}
          onChange={(e) => update({ type: e.target.value })}
          className={inputClass}
        >
          <option value="">All types</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {label(t)}
            </option>
          ))}
        </select>
        <select
          aria-label="City"
          value={city}
          onChange={(e) => update({ city: e.target.value })}
          className={inputClass}
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="Minimum bedrooms"
          value={bedrooms}
          onChange={(e) => update({ bedrooms: e.target.value })}
          className={inputClass}
        >
          <option value="">Any bedrooms</option>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}+ bedrooms
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          aria-label="Minimum price"
          placeholder="Min price"
          defaultValue={minPrice}
          onBlur={(e) => update({ min: e.target.value })}
          className={inputClass}
        />
        <input
          type="number"
          min="0"
          aria-label="Maximum price"
          placeholder="Max price"
          defaultValue={maxPrice}
          onBlur={(e) => update({ max: e.target.value })}
          className={inputClass}
        />
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
          className={inputClass}
        >
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={() => {
            setText("");
            router.replace("/listings");
          }}
          className="mt-3 text-sm font-medium text-blue-600"
        >
          Clear all filters
        </button>
      )}

      <div className="mt-6">
        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {loading && !data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        ) : data && data.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="font-medium">No properties match your search</p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing or clearing your filters.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">
              {data?.total} {data?.total === 1 ? "property" : "properties"} found
            </p>
            <div
              className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
                loading ? "opacity-60" : ""
              }`}
            >
              {data?.items.map((p) => (
                <PropertyCard key={p.id} p={p} />
              ))}
            </div>
          </>
        )}
      </div>

      {data && data.total > data.page_size && (
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => update({ page: String(Math.max(1, page - 1)) })}
            disabled={page <= 1}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => update({ page: String(Math.min(totalPages, page + 1)) })}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10">Loading...</div>}>
      <Listings />
    </Suspense>
  );
}