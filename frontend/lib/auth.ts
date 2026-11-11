export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  agency_id: string;
};

const TOKEN_KEY = "aqarflow_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? "Invalid email or password"
        : "Something went wrong. Please try again."
    );
  }
  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.access_token);
  return data.user;
}

export async function fetchMe(token: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}
