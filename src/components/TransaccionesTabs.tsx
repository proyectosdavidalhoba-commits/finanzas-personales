"use client";

import { useState } from "react";
import type { Account, Category, Transaction, Transfer } from "@/lib/types";
import { TransactionManager } from "@/components/TransactionManager";
import { TransferManager } from "@/components/TransferManager";

export function TransaccionesTabs({
  transactions,
  transfers,
  accounts,
  categories,
}: {
  transactions: Transaction[];
  transfers: Transfer[];
  accounts: Account[];
  categories: Category[];
}) {
  const [tab, setTab] = useState<"transacciones" | "transferencias">("transacciones");

  return (
    <div>
      <div className="mb-4 inline-flex gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1 text-sm">
        <button
          onClick={() => setTab("transacciones")}
          className={`rounded-lg px-3 py-1.5 font-medium transition ${
            tab === "transacciones" ? "bg-slate-700 text-indigo-300 shadow-sm" : "text-slate-300 hover:bg-slate-600/60"
          }`}
        >
          Transacciones
        </button>
        <button
          onClick={() => setTab("transferencias")}
          className={`rounded-lg px-3 py-1.5 font-medium transition ${
            tab === "transferencias" ? "bg-slate-700 text-indigo-300 shadow-sm" : "text-slate-300 hover:bg-slate-600/60"
          }`}
        >
          Transferencias
        </button>
      </div>

      {tab === "transacciones" ? (
        <TransactionManager transactions={transactions} accounts={accounts} categories={categories} />
      ) : (
        <TransferManager transfers={transfers} accounts={accounts} />
      )}
    </div>
  );
}
