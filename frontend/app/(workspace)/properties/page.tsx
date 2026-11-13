"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { apiFetch, MEDIA_BASE } from "@/lib/api";
import { fetchMe, getToken } from "@/lib/auth";
import {
  PROPERTY_TYPES,
  PURPOSES,
  STATUSES,
  formatPrice,
  label,
  type PropertyList,
} from "@/lib/properties";

const inputClass =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600";

export default function PropertiesPage() {
  const [data, setData] = useState<PropertyList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [q, setQ] = useState("");
  const [purpose, setPurpose] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = getToken();
    if (token) fetchMe(token).then((u) => setIsAdmin(u.role === "admin"));
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(page),
        page_size: "9",
      });
      if (q.trim()) params.set("q", q.trim());
      if (purpose) params.set("purpose", purpose);
      if (type) params.set("property_type", type);
      if (status) params.set("status", status);
      apiFetch<PropertyList>(`/properties?${params.toString()}`)
        .then((d) => active && setData(d))
        .catch((e: Error) => active && setError(e.message))
        .finally(() => active && setLoading(false));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q, purpose, type, status, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <>
      <PageHeader
        title="Properties"
        description="Manage your property inventory."
        action={
          isAdmin ? (
            <Link
              href="/properties/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add property
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          aria-label="Search properties"
          placeholder="Search title, city, code..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        />
        <select
          aria-label="Filter by purpose"
          value={purpose}
          onChange={(e) => {
            setPurpose(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="">All purposes</option>
          {PURPOSES.map((p) => (
            <option key={p} value={p}>
              For {p}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by type"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
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
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title="No properties found"
          text={
            q || purpose || type || status
              ? "Try changing or clearing your filters."
              : "Properties you add will appear here."
          }
        />
      ) : (
        <div
          className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
            loading ? "opacity-60" : ""
          }`}
        >
          {data?.items.map((p) => (
            <Link
              key={p.id}
              href={`/properties/${p.id}`}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {p.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${MEDIA_BASE}${p.cover_url}`}
                  alt={p.title}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center bg-slate-100 text-sm text-slate-400">
                  No image
                </div>
              )}
              <div className="p-4">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge value={p.status} />
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    For {p.purpose}
                  </span>
                  {p.is_published && (
                    <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Published
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
                <p className="mt-1 text-xs text-slate-500">
                  {[
                    label(p.property_type),
                    p.bedrooms != null ? `${p.bedrooms} bed` : null,
                    p.bathrooms != null ? `${p.bathrooms} bath` : null,
                    p.area_value != null
                      ? `${p.area_value} ${p.area_unit}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" \u00B7 ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && data.total > data.page_size && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
