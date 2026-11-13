const colors: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  draft: "bg-slate-100 text-slate-600",
  reserved: "bg-amber-100 text-amber-700",
  sold: "bg-blue-100 text-blue-700",
  rented: "bg-blue-100 text-blue-700",
  inactive: "bg-red-100 text-red-700",
};

export default function Badge({ value }: { value: string }) {
  const style = colors[value] ?? "bg-slate-100 text-slate-600";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </span>
  );
}
