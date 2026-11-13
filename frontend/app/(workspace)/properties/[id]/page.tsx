"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { apiFetch, MEDIA_BASE } from "@/lib/api";
import { formatPrice, label, type Property } from "@/lib/properties";
import { useIsAdmin } from "@/lib/useIsAdmin";

export default function PropertyDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const isAdmin = useIsAdmin();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    apiFetch<Property>(`/properties/${id}`)
      .then(setProperty)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !property) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const updated = await apiFetch<Property>(
        `/properties/${property.id}/media`,
        { method: "POST", body: form }
      );
      setProperty(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(mediaId: string) {
    if (!property) return;
    if (!window.confirm("Delete this image?")) return;
    setError("");
    try {
      const updated = await apiFetch<Property>(
        `/properties/${property.id}/media/${mediaId}`,
        { method: "DELETE" }
      );
      setProperty(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete image");
    }
  }

  async function archive() {
    if (!property) return;
    if (
      !window.confirm(
        "Archive this property? It will be marked inactive and unpublished."
      )
    )
      return;
    setError("");
    try {
      const updated = await apiFetch<Property>(`/properties/${property.id}`, {
        method: "DELETE",
      });
      setProperty(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive");
    }
  }

  if (error && !property)
    return (
      <>
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
        <Link href="/properties" className="text-sm text-blue-600">
          Back to properties
        </Link>
      </>
    );

  if (!property)
    return (
      <>
        <Skeleton className="mb-6 h-10 w-80" />
        <Skeleton className="h-72" />
      </>
    );

  const details: [string, string][] = [
    ["Reference", property.reference_code],
    ["Purpose", "For " + property.purpose],
    ["Type", label(property.property_type)],
    [
      "Area",
      property.area_value != null
        ? property.area_value + " " + property.area_unit
        : "-",
    ],
    ["Bedrooms", property.bedrooms != null ? String(property.bedrooms) : "-"],
    ["Bathrooms", property.bathrooms != null ? String(property.bathrooms) : "-"],
    ["City", property.city],
    ["Locality", property.locality ?? "-"],
    ["Address", property.address ?? "-"],
    ["Published", property.is_published ? "Yes" : "No"],
  ];

  return (
    <>
      <PageHeader
        title={property.title}
        description={[property.locality, property.city].filter(Boolean).join(", ")}
        action={
          isAdmin ? (
            <div className="flex gap-2">
              <Link
                href={`/properties/${property.id}/edit`}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Edit
              </Link>
              <Button variant="danger" onClick={archive}>
                Archive
              </Button>
            </div>
          ) : undefined
        }
      />

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Images</h2>
              {isAdmin && (
                <label className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  {uploading ? "Uploading..." : "Upload image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
            {property.media.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-400">
                No images yet
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {property.media.map((m) => (
                  <div key={m.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${MEDIA_BASE}${m.url}`}
                      alt={m.caption ?? property.title}
                      className="h-48 w-full rounded-md object-cover"
                    />
                    {m.is_cover && (
                      <span className="absolute left-2 top-2 rounded bg-blue-600 px-2 py-0.5 text-xs text-white">
                        Cover
                      </span>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => removeImage(m.id)}
                        className="absolute right-2 top-2 rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-white"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-slate-400">
              JPEG, PNG or WebP, up to 5 MB each, maximum 10 images.
            </p>
          </Card>

          <Card className="mt-6">
            <h2 className="mb-2 font-semibold text-slate-900">Description</h2>
            <p className="whitespace-pre-line text-sm text-slate-600">
              {property.description || "No description added."}
            </p>
          </Card>
        </div>

        <div>
          <Card>
            <p className="text-2xl font-semibold text-slate-900">
              {formatPrice(property.price, property.currency)}
            </p>
            <div className="mt-2">
              <Badge value={property.status} />
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {details.map(([k, val]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right text-slate-900">{val}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Link
            href="/properties"
            className="mt-4 inline-block text-sm text-blue-600"
          >
            Back to properties
          </Link>
        </div>
      </div>
    </>
  );
}
