"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Building2,
  Calendar,
  Hash,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getFatura, getFaturaExportUrl } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { TransacoesTable } from "@/components/faturas/TransacoesTable";
import type { FaturaWithTransacoes } from "@/types";

export default function FaturaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [fatura, setFatura] = useState<FaturaWithTransacoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getFatura(id)
      .then(setFatura)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erro ao carregar fatura")
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !fatura) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-5 py-4">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">
            {error ?? "Fatura não encontrada"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/faturas" className="hover:text-slate-800 transition-colors">
          Faturas
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{fatura.banco}</span>
      </div>

      {/* Header card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{fatura.banco}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{fatura.nome_arquivo}</p>
            </div>
          </div>

          <a
            href={getFaturaExportUrl(fatura.id)}
            download
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all self-start"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </a>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
              <TrendingUp className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Débitos</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(fatura.total_debitos)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <TrendingDown className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Créditos</p>
              <p className="text-sm font-semibold text-emerald-600">
                {formatCurrency(fatura.total_creditos)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
              <Hash className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Transações</p>
              <p className="text-sm font-semibold text-slate-900">
                {fatura.qtd_transacoes}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
              <Calendar className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Período</p>
              <p className="text-sm font-semibold text-slate-900">
                {fatura.periodo_inicio
                  ? `${formatDate(fatura.periodo_inicio)} – ${formatDate(fatura.periodo_fim)}`
                  : fatura.mes_referencia ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Upload realizado em {formatDateTime(fatura.data_upload)}
        </p>
      </div>

      {/* Transactions table */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4">
          Transações ({fatura.transacoes.length})
        </h3>
        <TransacoesTable transacoes={fatura.transacoes} />
      </div>
    </div>
  );
}
