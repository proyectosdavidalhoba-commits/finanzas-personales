"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth-actions";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/transacciones", label: "Transacciones" },
  { href: "/categorias", label: "Categorías" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/presupuestos", label: "Presupuestos" },
  { href: "/recurrentes", label: "Recurrentes" },
  { href: "/cuentas-por-cobrar", label: "Por cobrar" },
  { href: "/proveedores", label: "Proveedores" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            $
          </span>
          <span className="text-base font-semibold text-slate-50">Finanzas Personales</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 hover:bg-slate-800"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-3">
        <nav className="grid grid-cols-3 gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1 sm:grid-cols-4 md:grid-cols-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-2 py-2 text-center text-xs font-medium leading-tight transition sm:text-sm ${
                pathname === link.href
                  ? "bg-slate-700 text-indigo-300 shadow-sm"
                  : "text-slate-300 hover:bg-slate-600/60"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
