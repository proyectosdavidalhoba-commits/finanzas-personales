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

// Paleta validada para fondo oscuro (ver skill de dataviz): ingresos/egresos es un
// par semántico fijo (siempre los mismos dos colores en toda la app), validado con
// el script de la skill contra la superficie oscura real de la app (slate-900).
const INCOME_COLOR = "#008300";
const EXPENSE_COLOR = "#e66767";
const CHART_SURFACE = "#0f172a"; // slate-900, igual que las tarjetas
const GRIDLINE = "#334155"; // slate-700
const AXIS_LINE = "#475569"; // slate-600
const MUTED_INK = "#94a3b8"; // slate-400
const SECONDARY_INK = "#cbd5e1"; // slate-300

const currencyFormatter = (value: number) => `$${value.toLocaleString("es-CO")}`;

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#1e293b",
  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  fontSize: 13,
  color: "#f8fafc",
};

const legendStyle = { fontSize: 13, color: SECONDARY_INK };

export function DashboardCharts({ pieData, barData }: { pieData: PieDatum[]; barData: BarDatum[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-200">Gastos por categoría (este mes)</h2>
        {pieData.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Aún no hay egresos este mes.</p>
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

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-200">Ingresos vs egresos (últimos 6 meses)</h2>
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
            <Tooltip formatter={(value) => currencyFormatter(Number(value))} contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
            <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
            <Bar dataKey="ingresos" fill={INCOME_COLOR} name="Ingresos" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="egresos" fill={EXPENSE_COLOR} name="Egresos" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
