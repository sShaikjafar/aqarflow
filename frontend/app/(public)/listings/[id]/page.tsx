"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import InquiryForm from "@/components/public/InquiryForm";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { formatPrice, label } from "@/lib/properties";
import { imageSrc, publicFetch, type PublicProperty } from "@/lib/public";

function PropertyView() {
  const params = useParams();
  const id = String(params.id);
  const [p, setP] = useState<PublicProperty | null>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    publicFetch<PublicProperty>(`/public/properties/${id}`)
      .then(setP)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">This property is not available</p>
        <p className="mt-1 text-sm text-slate-500">
          It may have been sold, rented or removed.
        </p>
        <Link href="/listings" className="mt-4 inline-block text-sm font-medium text-blue-600">
          Browse other properties
        </Link>
      </div>
    );

  if (!p)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="mb-6 h-10 w-80" />
        <Skeleton className="h-96" />
      </div>
    );

  const main = p.media[active] ?? p.media[0];
  const mainSrc = main ? imageSrc(main.url) : null;

  const facts: [string, string][] = [
    ["Reference", p.reference_code],
    ["Purpose", "For " + p.purpose],
    ["Type", label(p.property_type)],
    ["Area", p.area_value != null ? p.area_value + " " + p.area_unit : "-"],
    ["Bedrooms", p.bedrooms != null ? String(p.bedrooms) : "-"],
    ["Bathrooms", p.bathrooms != null ? String(p.bathrooms) : "-"],
    ["City", p.city],
    ["Locality", p.locality ?? "-"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/listings" className="text-sm font-medium text-blue-600">
        Back to properties
      </Link>
      <h1 className="mt-3 text-3xl font-bold">{p.title}</h1>
      <p className="text-slate-500">
        {[p.locality, p.city].filter(Boolean).join(", ")}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {mainSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainSrc}
              alt={main?.caption ?? p.title}
              className="h-80 w-full rounded-lg object-cover sm:h-96"
            />
          ) : (
            <div className="flex h-80 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              No images available
            </div>
          )}
          {p.media.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {p.media.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setActive(i)}
                  aria-label={"Show image " + (i + 1)}
                  className={`shrink-0 overflow-hidden rounded-md border-2 ${
                    i === active ? "border-blue-600" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc(m.url) ?? ""}
                    alt=""
                    className="h-16 w-24 object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <Card className="mt-6">
            <h2 className="mb-2 font-semibold">About this property</h2>
            <p className="whitespace-pre-line text-sm text-slate-600">
              {p.description || "More details are available on request."}
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <p className="text-3xl font-bold">{formatPrice(p.price, p.currency)}</p>
            {p.status === "reserved" && (
              <p className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Reserved
              </p>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold">Interested? Send an inquiry</h2>
            <InquiryForm propertyId={p.id} propertyTitle={p.title} />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PublicPropertyPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-6xl px-4 py-10">Loading...</div>}
    >
      <PropertyView />
    </Suspense>
  );
}