"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { updateTransacao } from "@/lib/api";
import { CATEGORIAS } from "@/types";
import type { Transacao } from "@/types";

interface TransacoesTableProps {
  transacoes: Transacao[];
}

const PAGE_SIZE = 20;

interface EditingCell {
  id: string;
  field: "categoria" | "observacoes";
}

export function TransacoesTable({ transacoes }: TransacoesTableProps) {
  const [items, setItems] = useState<Transacao[]>(transacoes);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateItem = useCallback(
    (id: string, patch: Partial<Transacao>) => {
      setItems((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
    },
    []
  );

  async function saveField(
    id: string,
    field: "categoria" | "observacoes",
    value: string
  ) {
    setSaving(id);
    try {
      const updated = await updateTransacao(id, { [field]: value || null });
      updateItem(id, { [field]: updated[field] });
    } catch {
      // revert on error — find original
      const original = transacoes.find((t) => t.id === id);
      if (original) updateItem(id, { [field]: original[field] });
    } finally {
      setSaving(null);
      setEditing(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[200px]">
                Descrição
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Parcela
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[160px]">
                Categoria
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[180px]">
                Observações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageItems.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  Nenhuma transação encontrada
                </td>
              </tr>
            )}
            {pageItems.map((t) => {
              const isCredit =
                t.valor !== null && t.valor < 0;
              const isSavingThis = saving === t.id;

              return (
                <tr
                  key={t.id}
                  className={cn(
                    "transition-colors",
                    isSavingThis ? "bg-blue-50/50" : "hover:bg-slate-50"
                  )}
                >
                  {/* Data */}
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {formatDate(t.data)}
                  </td>

                  {/* Descrição */}
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    {t.descricao ?? "—"}
                  </td>

                  {/* Valor */}
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums",
                      isCredit ? "text-emerald-600" : "text-slate-900"
                    )}
                  >
                    {formatCurrency(t.valor)}
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-3">
                    {t.tipo ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          t.tipo.toLowerCase().includes("créd") ||
                            t.tipo.toLowerCase().includes("cred")
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {t.tipo}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Parcela */}
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {t.parcela ?? "—"}
                  </td>

                  {/* Categoria — editable */}
                  <td className="px-4 py-3">
                    {editing?.id === t.id && editing.field === "categoria" ? (
                      <select
                        autoFocus
                        defaultValue={t.categoria ?? ""}
                        onBlur={(e) =>
                          saveField(t.id, "categoria", e.target.value)
                        }
                        onChange={(e) =>
                          updateItem(t.id, { categoria: e.target.value || null })
                        }
                        className="w-full rounded-md border border-blue-400 bg-white py-1 pl-2 pr-6 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">— Sem categoria —</option>
                        {CATEGORIAS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() =>
                          setEditing({ id: t.id, field: "categoria" })
                        }
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs transition-colors text-left",
                          t.categoria
                            ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            : "text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        {t.categoria ?? "Adicionar"}
                      </button>
                    )}
                  </td>

                  {/* Observações — editable */}
                  <td className="px-4 py-3">
                    {editing?.id === t.id && editing.field === "observacoes" ? (
                      <input
                        autoFocus
                        type="text"
                        defaultValue={t.observacoes ?? ""}
                        onBlur={(e) =>
                          saveField(t.id, "observacoes", e.target.value)
                        }
                        className="w-full rounded-md border border-blue-400 bg-white py-1 px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : (
                      <button
                        onClick={() =>
                          setEditing({ id: t.id, field: "observacoes" })
                        }
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs transition-colors text-left max-w-[160px] truncate",
                          t.observacoes
                            ? "text-slate-700 hover:bg-slate-100"
                            : "text-slate-400 hover:bg-slate-100"
                        )}
                        title={t.observacoes ?? undefined}
                      >
                        {t.observacoes ?? "Adicionar nota"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {items.length} transações · página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                    page === pageNum
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
