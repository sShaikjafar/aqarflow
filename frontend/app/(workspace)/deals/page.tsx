import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function DealsPage() {
  return (
    <>
      <PageHeader title="Deals" description="Follow deals from inquiry to closing." />
      <EmptyState title="No deals yet" text="Deals you create will appear here." />
    </>
  );
}
