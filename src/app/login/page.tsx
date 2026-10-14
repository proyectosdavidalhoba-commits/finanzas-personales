"use client";

import { useActionState, useState } from "react";
import { login, signup, type AuthResult } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [state, formAction, pending] = useActionState<AuthResult, FormData>(
    async (_prev, formData) => (mode === "login" ? login(formData) : signup(formData)),
    undefined,
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-50">Finanzas Personales</h1>
        <p className="mt-1 text-sm text-slate-400">
          {mode === "login" ? "Inicia sesión en tu cuenta" : "Crea tu cuenta"}
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200">Correo</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {pending ? "Cargando..." : mode === "login" ? "Iniciar sesión" : "Registrarme"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-sm text-indigo-400 hover:underline"
        >
          {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </div>
  );
}
