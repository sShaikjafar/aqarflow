"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PropertyCard from "@/components/public/PropertyCard";
import Skeleton from "@/components/ui/Skeleton";
import { publicFetch, type PublicPropertyList } from "@/lib/public";

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [purpose, setPurpose] = useState("");
  const [featured, setFeatured] = useState<PublicPropertyList | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    publicFetch<PublicPropertyList>("/public/properties?page_size=3")
      .then(setFeatured)
      .catch((e: Error) => setError(e.message));
  }, []);

  function search(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (purpose) params.set("purpose", purpose);
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <>
      <section className="bg-slate-900 px-4 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">
            Find a home you will love
          </h1>
          <p className="mt-4 text-slate-300">
            Browse verified apartments, houses and plots from a trusted local
            agency.
          </p>
          <form
            onSubmit={search}
            className="mx-auto mt-8 grid max-w-2xl gap-3 rounded-lg bg-white p-3 sm:grid-cols-4"
          >
            <input
              aria-label="Search by city or locality"
              placeholder="City or locality"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 sm:col-span-2"
            />
            <select
              aria-label="Buy or rent"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option value="">Buy or rent</option>
              <option value="sale">Buy</option>
              <option value="rent">Rent</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Latest properties</h2>
          <Link href="/listings" className="text-sm font-medium text-blue-600">
            View all
          </Link>
        </div>
        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {!featured && !error && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        )}
        {featured && featured.items.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500">
            New properties are coming soon. Please check back later.
          </p>
        )}
        {featured && featured.items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.items.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
