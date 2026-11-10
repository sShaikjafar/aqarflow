"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/properties", label: "Properties" },
  { href: "/leads", label: "Leads" },
  { href: "/visits", label: "Visits" },
  { href: "/deals", label: "Deals" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="min-h-screen w-60 shrink-0 bg-slate-900 p-4 text-white">
      <div className="mb-8 text-xl font-bold">AqarFlow</div>
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm ${
                active ? "bg-blue-600" : "hover:bg-slate-800"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}