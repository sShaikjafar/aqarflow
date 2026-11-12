import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function LeadsPage() {
  return (
    <>
      <PageHeader title="Leads" description="Track inquiries and follow-ups." />
      <EmptyState title="No leads yet" text="Inquiries from the website will appear here." />
    </>
  );
}
