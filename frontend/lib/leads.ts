export type LeadContact = {
  name: string;
  phone: string | null;
  email: string | null;
};

export type LeadProperty = {
  id: string;
  title: string;
  reference_code: string;
  city: string;
  locality: string | null;
};

export type LeadAgent = {
  id: string;
  full_name: string;
  role: string;
};

export type Lead = {
  id: string;
  stage: string;
  source: string;
  message: string | null;
  preferred_contact: string;
  created_at: string;
  updated_at: string;
  contact: LeadContact;
  property: LeadProperty | null;
  assigned_agent: LeadAgent | null;
};

export type LeadActivity = {
  id: string;
  activity_type: string;
  body: string;
  author: string | null;
  created_at: string;
};

export type LeadDetail = Lead & { activities: LeadActivity[] };

export type LeadList = {
  items: Lead[];
  total: number;
  page: number;
  page_size: number;
};

export const STAGES = [
  "new",
  "contacted",
  "qualified",
  "visit_scheduled",
  "negotiation",
  "converted",
  "lost",
];

export function stageLabel(stage: string): string {
  const text = stage.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
