"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import {
  AREA_UNITS,
  PROPERTY_TYPES,
  PURPOSES,
  STATUSES,
  label,
  type Property,
} from "@/lib/properties";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600";

type Values = {
  title: string;
  description: string;
  purpose: string;
  property_type: string;
  price: string;
  area_value: string;
  area_unit: string;
  bedrooms: string;
  bathrooms: string;
  address: string;
  city: string;
  locality: string;
  status: string;
  is_published: boolean;
};

function toValues(p?: Property): Values {
  return {
    title: p?.title ?? "",
    description: p?.description ?? "",
    purpose: p?.purpose ?? "sale",
    property_type: p?.property_type ?? "apartment",
    price: p ? String(p.price) : "",
    area_value: p?.area_value != null ? String(p.area_value) : "",
    area_unit: p?.area_unit ?? "sqft",
    bedrooms: p?.bedrooms != null ? String(p.bedrooms) : "",
    bathrooms: p?.bathrooms != null ? String(p.bathrooms) : "",
    address: p?.address ?? "",
    city: p?.city ?? "",
    locality: p?.locality ?? "",
    status: p?.status ?? "draft",
    is_published: p?.is_published ?? false,
  };
}

function validate(v: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  if (v.title.trim().length < 3) errors.title = "Title must be at least 3 characters";
  if (!v.price || Number(v.price) <= 0) errors.price = "Enter a price greater than 0";
  if (v.city.trim().length < 2) errors.city = "City is required";
  if (v.area_value && Number(v.area_value) <= 0)
    errors.area_value = "Area must be greater than 0";
  if (v.bedrooms !== "" && (Number(v.bedrooms) < 0 || Number(v.bedrooms) > 50))
    errors.bedrooms = "Enter a number from 0 to 50";
  if (v.bathrooms !== "" && (Number(v.bathrooms) < 0 || Number(v.bathrooms) > 50))
    errors.bathrooms = "Enter a number from 0 to 50";
  if (v.is_published && v.status === "draft")
    errors.status = "A draft property cannot be published";
  return errors;
}

function Field({
  text,
  error,
  children,
}: {
  text: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{text}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export default function PropertyForm({ property }: { property?: Property }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(toValues(property));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const found = validate(v);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload: Record<string, unknown> = {
      title: v.title.trim(),
      description: v.description.trim() || null,
      purpose: v.purpose,
      property_type: v.property_type,
      price: Number(v.price),
      area_value: v.area_value ? Number(v.area_value) : null,
      area_unit: v.area_unit,
      bedrooms: v.bedrooms !== "" ? Number(v.bedrooms) : null,
      bathrooms: v.bathrooms !== "" ? Number(v.bathrooms) : null,
      address: v.address.trim() || null,
      city: v.city.trim(),
      locality: v.locality.trim() || null,
      status: v.status,
      is_published: v.is_published,
    };
    if (!property) payload.currency = "INR";

    setSaving(true);
    try {
      const saved = await apiFetch<Property>(
        property ? `/properties/${property.id}` : "/properties",
        {
          method: property ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );
      router.push(`/properties/${saved.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field text="Title" error={errors.title}>
            <input
              className={inputClass}
              value={v.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. 3 BHK Apartment in Baner"
            />
          </Field>
        </div>

        <Field text="Purpose">
          <select
            className={inputClass}
            value={v.purpose}
            onChange={(e) => set("purpose", e.target.value)}
          >
            {PURPOSES.map((p) => (
              <option key={p} value={p}>
                For {p}
              </option>
            ))}
          </select>
        </Field>

        <Field text="Property type">
          <select
            className={inputClass}
            value={v.property_type}
            onChange={(e) => set("property_type", e.target.value)}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {label(t)}
              </option>
            ))}
          </select>
        </Field>

        <Field text="Price (INR)" error={errors.price}>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={v.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field text="Area" error={errors.area_value}>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={v.area_value}
              onChange={(e) => set("area_value", e.target.value)}
            />
          </Field>
          <Field text="Unit">
            <select
              className={inputClass}
              value={v.area_unit}
              onChange={(e) => set("area_unit", e.target.value)}
            >
              {AREA_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field text="Bedrooms" error={errors.bedrooms}>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={v.bedrooms}
            onChange={(e) => set("bedrooms", e.target.value)}
          />
        </Field>

        <Field text="Bathrooms" error={errors.bathrooms}>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={v.bathrooms}
            onChange={(e) => set("bathrooms", e.target.value)}
          />
        </Field>

        <Field text="City" error={errors.city}>
          <input
            className={inputClass}
            value={v.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </Field>

        <Field text="Locality / area">
          <input
            className={inputClass}
            value={v.locality}
            onChange={(e) => set("locality", e.target.value)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field text="Address">
            <input
              className={inputClass}
              value={v.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field text="Description">
            <textarea
              rows={4}
              className={inputClass}
              value={v.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
        </div>

        <Field text="Status" error={errors.status}>
          <select
            className={inputClass}
            value={v.status}
            onChange={(e) => {
              set("status", e.target.value);
              if (e.target.value === "draft") set("is_published", false);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </Field>

        <label className="flex items-center gap-2 pt-6 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={v.is_published}
            disabled={v.status === "draft"}
            onChange={(e) => set("is_published", e.target.checked)}
          />
          Publish on the public website
        </label>
      </div>

      {serverError && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : property ? "Save changes" : "Create property"}
        </Button>
        <Link
          href={property ? `/properties/${property.id}` : "/properties"}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
