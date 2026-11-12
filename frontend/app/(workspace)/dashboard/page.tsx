import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A quick overview of your agency."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active listings" value="0" hint="Published properties" />
        <StatCard label="New leads" value="0" hint="Waiting for follow-up" />
        <StatCard label="Visits" value="0" hint="Scheduled visits" />
        <StatCard label="Open deals" value="0" hint="In the pipeline" />
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Recent activity</h2>
      <EmptyState
        title="No activity yet"
        text="Property, lead and visit activity will appear here."
      />
    </>
  );
}
