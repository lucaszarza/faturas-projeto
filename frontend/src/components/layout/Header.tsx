"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/upload": "Upload de Faturas",
  "/faturas": "Histórico de Faturas",
};

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/faturas/")) return "Detalhe da Fatura";
  return "Faturas";
}

export function Header() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shrink-0">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-xs font-semibold text-white">U</span>
        </div>
      </div>
    </header>
  );
}
