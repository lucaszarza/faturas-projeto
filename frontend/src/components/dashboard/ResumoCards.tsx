import { TrendingUp, TrendingDown, ArrowUpDown, Hash } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ResumoMes } from "@/types";

interface ResumoCardsProps {
  resumo: ResumoMes | null;
}

export function ResumoCards({ resumo }: ResumoCardsProps) {
  const cards = [
    {
      label: "Total do Mês",
      value: resumo ? formatCurrency(resumo.total_debitos - Math.abs(resumo.total_creditos)) : "—",
      icon: ArrowUpDown,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      subtext: "saldo líquido",
    },
    {
      label: "Débitos",
      value: resumo ? formatCurrency(resumo.total_debitos) : "—",
      icon: TrendingUp,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      subtext: "total de saídas",
    },
    {
      label: "Créditos",
      value: resumo ? formatCurrency(Math.abs(resumo.total_creditos)) : "—",
      icon: TrendingDown,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      subtext: "total de entradas",
      valueClass: "text-emerald-600",
    },
    {
      label: "Saldo",
      value: resumo ? formatCurrency(resumo.saldo) : "—",
      icon: Hash,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      subtext: "débitos − créditos",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p
                  className={`mt-1.5 text-2xl font-bold tracking-tight ${
                    card.valueClass ?? "text-slate-900"
                  }`}
                >
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{card.subtext}</p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
