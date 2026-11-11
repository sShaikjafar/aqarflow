"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { clearSession, fetchMe, getToken, type User } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchMe(token)
      .then(setUser)
      .catch(() => {
        clearSession();
        router.replace("/login");
      });
  }, [router]);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-white px-6">
          <span className="text-sm text-slate-500">Workspace</span>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {user.full_name} ({user.role})
            </span>
            <button
              onClick={logout}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
