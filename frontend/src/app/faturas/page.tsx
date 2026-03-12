"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { getFaturas } from "@/lib/api";
import { FaturaCard } from "@/components/faturas/FaturaCard";
import type { Fatura } from "@/types";

export default function FaturasPage() {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFaturas()
      .then((data) => setFaturas(data))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erro ao carregar faturas")
      )
      .finally(() => setLoading(false));
  }, []);

  function handleDeleted(id: string) {
    setFaturas((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {faturas.length > 0
              ? `${faturas.length} fatura${faturas.length !== 1 ? "s" : ""} encontrada${faturas.length !== 1 ? "s" : ""}`
              : "Nenhuma fatura"}
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Nova fatura
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-5 py-4">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && faturas.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white py-20 gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Nenhuma fatura ainda
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Faça upload de um PDF de fatura para começar
            </p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Fazer upload
          </Link>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && faturas.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {faturas.map((fatura) => (
            <FaturaCard
              key={fatura.id}
              fatura={fatura}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
