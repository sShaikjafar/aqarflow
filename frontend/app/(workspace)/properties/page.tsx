import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function PropertiesPage() {
  return (
    <>
      <PageHeader title="Properties" description="Manage your property inventory." />
      <EmptyState title="No properties yet" text="Properties you add will appear here." />
    </>
  );
}
