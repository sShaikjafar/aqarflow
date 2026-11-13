import { API_URL, clearSession, getToken } from "@/lib/auth";

// Images are served from the API server, outside /api/v1
export const MEDIA_BASE = API_URL.replace(/\/api\/v1\/?$/, "");

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired. Please sign in again.");
  }
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const data = await res.json();
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail))
        message = data.detail
          .map((d: { msg: string }) => d.msg)
          .join(", ");
    } catch {
      // keep the default message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
