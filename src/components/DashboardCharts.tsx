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

const currencyFormatter = (value: number) => `$${value.toLocaleString("es-CO")}`;

export function DashboardCharts({ pieData, barData }: { pieData: PieDatum[]; barData: BarDatum[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Gastos por categoría (este mes)</h2>
        {pieData.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Aún no hay egresos este mes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => currencyFormatter(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Ingresos vs egresos (últimos 6 meses)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => currencyFormatter(Number(value))} />
            <Legend />
            <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" radius={[4, 4, 0, 0]} />
            <Bar dataKey="egresos" fill="#ef4444" name="Egresos" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
