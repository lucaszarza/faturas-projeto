"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Hash,
  Trash2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { deleteFatura } from "@/lib/api";
import type { Fatura } from "@/types";

interface FaturaCardProps {
  fatura: Fatura;
  onDeleted: (id: string) => void;
}

export function FaturaCard({ fatura, onDeleted }: FaturaCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteFatura(fatura.id);
      onDeleted(fatura.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir fatura");
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 leading-tight">
              {fatura.banco}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {fatura.nome_arquivo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Excluir fatura"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Confirmar exclusão?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Excluindo…" : "Sim"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Não
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-slate-400">Total débitos</p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">
            {formatCurrency(fatura.total_debitos)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Créditos</p>
          <p className="text-sm font-semibold text-emerald-600 mt-0.5">
            {formatCurrency(fatura.total_creditos)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Transações</p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">
            {fatura.qtd_transacoes}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          {fatura.periodo_inicio && fatura.periodo_fim && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(fatura.periodo_inicio)} –{" "}
              {formatDate(fatura.periodo_fim)}
            </span>
          )}
          {fatura.mes_referencia && (
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              {fatura.mes_referencia}
            </span>
          )}
          <span>Upload: {formatDateTime(fatura.data_upload)}</span>
        </div>

        <Link
          href={`/faturas/${fatura.id}`}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          Ver detalhes
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
