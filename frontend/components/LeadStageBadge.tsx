import { stageLabel } from "@/lib/leads";

const colors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-sky-100 text-sky-700",
  qualified: "bg-indigo-100 text-indigo-700",
  visit_scheduled: "bg-amber-100 text-amber-700",
  negotiation: "bg-orange-100 text-orange-700",
  converted: "bg-green-100 text-green-700",
  lost: "bg-slate-200 text-slate-600",
};

export default function LeadStageBadge({ stage }: { stage: string }) {
  const style = colors[stage] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {stageLabel(stage)}
    </span>
  );
}
