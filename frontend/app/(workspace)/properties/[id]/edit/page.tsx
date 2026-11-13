"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PropertyForm from "@/components/PropertyForm";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import type { Property } from "@/lib/properties";
import { useIsAdmin } from "@/lib/useIsAdmin";

export default function EditPropertyPage() {
  const params = useParams();
  const id = String(params.id);
  const isAdmin = useIsAdmin();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Property>(`/properties/${id}`)
      .then(setProperty)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error)
    return (
      <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  if (isAdmin === null || !property) return <Skeleton className="h-64 max-w-3xl" />;
  if (!isAdmin)
    return (
      <EmptyState
        title="Admin access required"
        text="Only agency admins can edit properties."
      />
    );

  return (
    <>
      <PageHeader title="Edit property" description={property.reference_code} />
      <PropertyForm property={property} />
    </>
  );
}
