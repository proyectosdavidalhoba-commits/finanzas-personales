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
      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
        <button
          onClick={() => setTab("transacciones")}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            tab === "transacciones" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          Transacciones
        </button>
        <button
          onClick={() => setTab("transferencias")}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            tab === "transferencias" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
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
