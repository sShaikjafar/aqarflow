"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import LeadStageBadge from "@/components/LeadStageBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import {
  STAGES,
  formatDateTime,
  stageLabel,
  type LeadAgent,
  type LeadDetail,
} from "@/lib/leads";
import { useIsAdmin } from "@/lib/useIsAdmin";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600";

const typeLabel: Record<string, string> = {
  note: "Note",
  stage_change: "Stage change",
  assignment: "Assignment",
};

function LeadView() {
  const params = useParams();
  const id = String(params.id);
  const isAdmin = useIsAdmin();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [agents, setAgents] = useState<LeadAgent[]>([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch<LeadDetail>(`/leads/${id}`)
      .then(setLead)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (isAdmin) {
      apiFetch<LeadAgent[]>("/leads/agents")
        .then(setAgents)
        .catch(() => {});
    }
  }, [isAdmin]);

  async function run(action: () => Promise<LeadDetail>): Promise<boolean> {
    setBusy(true);
    setActionError("");
    try {
      setLead(await action());
      return true;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function changeStage(value: string) {
    run(() =>
      apiFetch<LeadDetail>(`/leads/${id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage: value }),
      })
    );
  }

  function assign(value: string) {
    run(() =>
      apiFetch<LeadDetail>(`/leads/${id}/assign`, {
        method: "POST",
        body: JSON.stringify({ agent_id: value || null }),
      })
    );
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    const ok = await run(() =>
      apiFetch<LeadDetail>(`/leads/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ body: note.trim() }),
      })
    );
    if (ok) setNote("");
  }

  if (error)
    return (
      <>
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
        <Link href="/leads" className="text-sm font-medium text-blue-600">
          Back to leads
        </Link>
      </>
    );

  if (!lead)
    return (
      <>
        <Skeleton className="mb-6 h-10 w-72" />
        <Skeleton className="h-72" />
      </>
    );

  return (
    <>
      <PageHeader
        title={lead.contact.name}
        description={"Received " + formatDateTime(lead.created_at)}
        action={<LeadStageBadge stage={lead.stage} />}
      />

      {actionError && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Inquiry</h2>
            <p className="whitespace-pre-line text-sm text-slate-700">
              {lead.message || "No message was left."}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Preferred contact: {lead.preferred_contact} | Source:{" "}
              {lead.source}
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Add a note</h2>
            <form onSubmit={addNote} className="space-y-3">
              <textarea
                rows={3}
                maxLength={2000}
                aria-label="Note"
                placeholder="e.g. Called the buyer, visit planned for Saturday."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={inputClass}
              />
              <Button type="submit" disabled={busy || !note.trim()}>
                {busy ? "Saving..." : "Add note"}
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Activity</h2>
            {lead.activities.length === 0 ? (
              <p className="text-sm text-slate-500">No activity yet.</p>
            ) : (
              <ul className="space-y-4">
                {lead.activities.map((a) => (
                  <li
                    key={a.id}
                    className="border-l-2 border-slate-200 pl-4"
                  >
                    <p className="text-xs text-slate-500">
                      {typeLabel[a.activity_type] ?? a.activity_type} |{" "}
                      {a.author ?? "System"} | {formatDateTime(a.created_at)}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-800">
                      {a.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Contact</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Name</dt>
                <dd className="text-right text-slate-900">
                  {lead.contact.name}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-right">
                  {lead.contact.phone ? (
                    <a
                      href={"tel:" + lead.contact.phone}
                      className="text-blue-600"
                    >
                      {lead.contact.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Email</dt>
                <dd className="break-all text-right">
                  {lead.contact.email ? (
                    <a
                      href={"mailto:" + lead.contact.email}
                      className="text-blue-600"
                    >
                      {lead.contact.email}
                    </a>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Property</h2>
            {lead.property ? (
              <div className="text-sm">
                <p className="font-medium text-slate-900">
                  {lead.property.title}
                </p>
                <p className="text-slate-500">
                  {[lead.property.locality, lead.property.city]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {lead.property.reference_code}
                </p>
                <Link
                  href={`/properties/${lead.property.id}`}
                  className="mt-2 inline-block font-medium text-blue-600"
                >
                  View property
                </Link>
              </div>
            ) : (
              <p className="text-sm text-slate-500">General inquiry.</p>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Manage</h2>
            <label
              htmlFor="stage"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Stage
            </label>
            <select
              id="stage"
              value={lead.stage}
              disabled={busy}
              onChange={(e) => changeStage(e.target.value)}
              className={inputClass}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {stageLabel(s)}
                </option>
              ))}
            </select>

            <label
              htmlFor="agent"
              className="mb-1 mt-4 block text-sm font-medium text-slate-700"
            >
              Assigned to
            </label>
            {isAdmin ? (
              <select
                id="agent"
                value={lead.assigned_agent?.id ?? ""}
                disabled={busy}
                onChange={(e) => assign(e.target.value)}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name} ({a.role})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-700">
                {lead.assigned_agent?.full_name ?? "Unassigned"}
              </p>
            )}
          </Card>

          <Link href="/leads" className="inline-block text-sm text-blue-600">
            Back to leads
          </Link>
        </div>
      </div>
    </>
  );
}

export default function LeadPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72" />}>
      <LeadView />
    </Suspense>
  );
}