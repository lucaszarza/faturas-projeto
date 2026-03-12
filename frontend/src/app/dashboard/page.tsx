"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getResumoMensal,
  getResumoCategorias,
  getResumoCartoes,
} from "@/lib/api";
import { currentMonth, formatMonthLabel } from "@/lib/utils";
import { ResumoCards } from "@/components/dashboard/ResumoCards";
import { GraficoEvolucao } from "@/components/dashboard/GraficoEvolucao";
import { GraficoCategorias } from "@/components/dashboard/GraficoCategorias";
import { GraficoCartoes } from "@/components/dashboard/GraficoCartoes";
import type {
  EvolucaoMensal,
  ResumoCategorias,
  ResumoCartoes,
  ResumoMes,
} from "@/types";

function addMonths(yyyyMm: string, delta: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [mes, setMes] = useState<string>(currentMonth());
  const [evolucao, setEvolucao] = useState<EvolucaoMensal | null>(null);
  const [categorias, setCategorias] = useState<ResumoCategorias[] | null>(null);
  const [cartoes, setCartoes] = useState<ResumoCartoes[] | null>(null);
  const [loading, setLoading] = useState(true);

  const resumoMes: ResumoMes | null =
    evolucao?.meses.find((m) => m.mes === mes) ?? null;

  const fetchAll = useCallback(async (selectedMes: string) => {
    setLoading(true);
    try {
      const [ev, cat, car] = await Promise.all([
        getResumoMensal(),
        getResumoCategorias(selectedMes),
        getResumoCartoes(selectedMes),
      ]);
      setEvolucao(ev);
      setCategorias(cat);
      setCartoes(car);
    } catch (e) {
      console.error("Erro ao carregar dados do dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(mes);
  }, [mes, fetchAll]);

  return (
    <div className="space-y-6">
      {/* Top bar with month selector */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Resumo do mês selecionado</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          <button
            onClick={() => setMes((m) => addMonths(m, -1))}
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[110px] text-center text-sm font-semibold text-slate-800">
            {formatMonthLabel(mes)}
          </span>
          <button
            onClick={() => setMes((m) => addMonths(m, 1))}
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          <ResumoCards resumo={resumoMes} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GraficoEvolucao data={evolucao} />
            <GraficoCategorias data={categorias} />
          </div>

          <GraficoCartoes data={cartoes} />
        </>
      )}
    </div>
  );
}
