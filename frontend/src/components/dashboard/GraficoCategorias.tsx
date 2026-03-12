"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { ResumoCategorias } from "@/types";

interface GraficaCategoriasProps {
  data: ResumoCategorias[] | null;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
  "#84cc16",
  "#6366f1",
  "#14b8a6",
];

interface TooltipPayload {
  name: string;
  value: number;
  payload: { percent: number };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-800">{item.name}</p>
      <p className="text-slate-600 mt-1">{formatCurrency(item.value)}</p>
      <p className="text-slate-400 text-xs">
        {(item.payload.percent * 100).toFixed(1)}%
      </p>
    </div>
  );
}

export function GraficoCategorias({ data }: GraficaCategoriasProps) {
  const chartData = (data ?? []).map((item) => ({
    name: item.categoria || "Outros",
    value: Math.abs(item.total),
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">
        Gastos por Categoria
      </h3>
      {chartData.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">
          Sem dados disponíveis
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              outerRadius={90}
              innerRadius={50}
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", color: "#64748b" }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
