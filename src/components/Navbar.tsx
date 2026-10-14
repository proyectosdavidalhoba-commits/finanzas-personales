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
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
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
    </nav>
  );
}
