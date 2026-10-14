"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type PieDatum = { name: string; value: number; color: string };
type BarDatum = { month: string; ingresos: number; egresos: number };

// Paleta validada (ver skill de dataviz): ingresos/egresos es un par semántico fijo
// (siempre los mismos dos colores en toda la app), no una serie categórica genérica.
const INCOME_COLOR = "#008300";
const EXPENSE_COLOR = "#e34948";
const CHART_SURFACE = "#fcfcfb";
const GRIDLINE = "#e1e0d9";
const AXIS_LINE = "#c3c2b7";
const MUTED_INK = "#898781";
const SECONDARY_INK = "#52514e";

const currencyFormatter = (value: number) => `$${value.toLocaleString("es-CO")}`;

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e1e0d9",
  boxShadow: "0 2px 8px rgba(11,11,11,0.08)",
  fontSize: 13,
  color: "#0b0b0b",
};

const legendStyle = { fontSize: 13, color: SECONDARY_INK };

export function DashboardCharts({ pieData, barData }: { pieData: PieDatum[]; barData: BarDatum[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Gastos por categoría (este mes)</h2>
        {pieData.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Aún no hay egresos este mes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                stroke={CHART_SURFACE}
                strokeWidth={2}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => currencyFormatter(Number(value))} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Ingresos vs egresos (últimos 6 meses)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData} barGap={2} barCategoryGap="24%">
            <CartesianGrid strokeDasharray="none" stroke={GRIDLINE} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: MUTED_INK }}
              axisLine={{ stroke: AXIS_LINE }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: MUTED_INK }}
              axisLine={{ stroke: AXIS_LINE }}
              tickLine={false}
              tickFormatter={(value) => currencyFormatter(Number(value))}
              width={72}
            />
            <Tooltip formatter={(value) => currencyFormatter(Number(value))} contentStyle={tooltipStyle} cursor={{ fill: "rgba(11,11,11,0.04)" }} />
            <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
            <Bar dataKey="ingresos" fill={INCOME_COLOR} name="Ingresos" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="egresos" fill={EXPENSE_COLOR} name="Egresos" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
