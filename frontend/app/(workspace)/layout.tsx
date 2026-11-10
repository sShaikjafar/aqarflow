import Sidebar from "@/components/Sidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-white px-6">
          <span className="text-sm text-slate-500">Workspace</span>
          <span className="text-sm font-medium">Admin</span>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}