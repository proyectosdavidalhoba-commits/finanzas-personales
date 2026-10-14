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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            $
          </span>
          <span className="text-base font-semibold text-slate-900">Finanzas Personales</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-3">
        <nav className="flex w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:bg-white/60"
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
