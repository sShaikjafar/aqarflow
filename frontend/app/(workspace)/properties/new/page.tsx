"use client";

import PropertyForm from "@/components/PropertyForm";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { useIsAdmin } from "@/lib/useIsAdmin";

export default function NewPropertyPage() {
  const isAdmin = useIsAdmin();

  if (isAdmin === null) return <Skeleton className="h-64 max-w-3xl" />;
  if (!isAdmin)
    return (
      <EmptyState
        title="Admin access required"
        text="Only agency admins can add properties."
      />
    );

  return (
    <>
      <PageHeader
        title="Add property"
        description="Create a new listing. Images can be added after saving."
      />
      <PropertyForm />
    </>
  );
}
