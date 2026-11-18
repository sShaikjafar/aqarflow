"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LeadStageBadge from "@/components/LeadStageBadge";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import {
  STAGES,
  formatDate,
  stageLabel,
  type LeadAgent,
  type LeadList,
} from "@/lib/leads";
import { useIsAdmin } from "@/lib/useIsAdmin";

const inputClass =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600";

export default function LeadsPage() {
  const isAdmin = useIsAdmin();
  const [data, setData] = useState<LeadList | null>(null);
  const [agents, setAgents] = useState<LeadAgent[]>([]);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [agent, setAgent] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdmin) {
      apiFetch<LeadAgent[]>("/leads/agents")
        .then(setAgents)
        .catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(page),
        page_size: "10",
      });
      if (q.trim()) params.set("q", q.trim());
      if (stage) params.set("stage", stage);
      if (agent === "unassigned") params.set("unassigned", "true");
      else if (agent) params.set("agent_id", agent);
      apiFetch<LeadList>(`/leads?${params.toString()}`)
        .then((d) => active && setData(d))
        .catch((e: Error) => active && setError(e.message))
        .finally(() => active && setLoading(false));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q, stage, agent, page]);

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.page_size))
    : 1;
  const hasFilters = q || stage || agent;

  return (
    <>
      <PageHeader
        title="Leads"
        description={
          isAdmin
            ? "All inquiries for your agency."
            : "Inquiries assigned to you."
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          aria-label="Search leads"
          placeholder="Search name, phone or email..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        />
        <select
          aria-label="Filter by stage"
          value={stage}
          onChange={(e) => {
            setStage(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {stageLabel(s)}
            </option>
          ))}
        </select>
        {isAdmin && (
          <select
            aria-label="Filter by agent"
            value={agent}
            onChange={(e) => {
              setAgent(e.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
        )}
        {hasFilters && (
          <button
            onClick={() => {
              setQ("");
              setStage("");
              setAgent("");
              setPage(1);
            }}
            className="text-left text-sm font-medium text-blue-600"
          >
            Clear all filters
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && !data ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title="No leads found"
          text={
            hasFilters
              ? "Try changing or clearing your filters."
              : isAdmin
                ? "Inquiries from the website will appear here."
                : "No leads are assigned to you yet."
          }
        />
      ) : (
        <div
          className={`overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm ${
            loading ? "opacity-60" : ""
          }`}
        >
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Assigned to</th>
                <th className="px-4 py-3 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {lead.contact.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {lead.contact.phone || lead.contact.email || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {lead.property ? lead.property.title : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <LeadStageBadge stage={lead.stage} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {lead.assigned_agent ? (
                      lead.assigned_agent.full_name
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(lead.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > data.page_size && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}