import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function VisitsPage() {
  return (
    <>
      <PageHeader title="Visits" description="Schedule and track property visits." />
      <EmptyState title="No visits scheduled" text="Scheduled visits will appear here." />
    </>
  );
}
