import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-slate-900">
          Aqar<span className="text-blue-600">Flow</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-5 text-sm font-medium">
          <Link href="/" className="text-slate-600 hover:text-slate-900">
            Home
          </Link>
          <Link href="/listings" className="text-slate-600 hover:text-slate-900">
            Properties
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
          >
            Staff login
          </Link>
        </nav>
      </div>
    </header>
  );
}
