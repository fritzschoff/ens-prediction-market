"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";

interface BetPanelProps {
  yesPrice: number;
  noPrice: number;
  onBet: (outcome: boolean, amount: string) => void;
  disabled?: boolean;
}

export function BetPanel({ yesPrice, noPrice, onBet, disabled }: BetPanelProps) {
  const { isConnected } = useAccount();
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);
  const [amount, setAmount] = useState("");

  const potentialWin =
    selectedOutcome !== null && amount
      ? (parseFloat(amount) / (selectedOutcome ? yesPrice : noPrice)).toFixed(2)
      : "0.00";

  const handleBet = () => {
    if (selectedOutcome !== null && amount) {
      onBet(selectedOutcome, amount);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">Place Bet</h3>

      <div className="mb-4 flex gap-3">
        <button
          onClick={() => setSelectedOutcome(true)}
          disabled={disabled}
          className={cn(
            "flex-1 rounded-xl p-4 text-center transition-all",
            selectedOutcome === true
              ? "bg-emerald-500 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900"
              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="text-2xl font-bold">{(yesPrice * 100).toFixed(0)}%</div>
          <div className="text-sm font-medium opacity-80">YES</div>
        </button>
        <button
          onClick={() => setSelectedOutcome(false)}
          disabled={disabled}
          className={cn(
            "flex-1 rounded-xl p-4 text-center transition-all",
            selectedOutcome === false
              ? "bg-rose-500 text-white ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900"
              : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="text-2xl font-bold">{(noPrice * 100).toFixed(0)}%</div>
          <div className="text-sm font-medium opacity-80">NO</div>
        </button>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-slate-400">
          Amount (USDC)
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={disabled}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-lg font-medium text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
            USDC
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {["10", "25", "50", "100"].map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(preset)}
            disabled={disabled}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300 disabled:opacity-50"
          >
            ${preset}
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl bg-slate-800/30 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Potential Win</span>
          <span className="font-mono text-lg font-semibold text-slate-100">
            ${potentialWin}
          </span>
        </div>
      </div>

      <button
        onClick={handleBet}
        disabled={disabled || !isConnected || selectedOutcome === null || !amount}
        className={cn(
          "w-full rounded-xl py-4 text-lg font-semibold transition-all",
          selectedOutcome === true
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : selectedOutcome === false
            ? "bg-rose-500 text-white hover:bg-rose-600"
            : "bg-indigo-500 text-white hover:bg-indigo-600",
          (disabled || !isConnected || selectedOutcome === null || !amount) &&
            "opacity-50 cursor-not-allowed"
        )}
      >
        {!isConnected
          ? "Connect Wallet"
          : selectedOutcome === null
          ? "Select Outcome"
          : `Bet on ${selectedOutcome ? "YES" : "NO"}`}
      </button>
    </div>
  );
}

