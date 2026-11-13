"use client";

import { useEffect, useState } from "react";
import { fetchMe, getToken } from "@/lib/auth";

export function useIsAdmin(): boolean | null {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAdmin(false);
      return;
    }
    fetchMe(token)
      .then((u) => setIsAdmin(u.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  return isAdmin;
}
