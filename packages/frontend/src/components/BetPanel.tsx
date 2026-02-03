"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { useEthPrice } from "@/hooks";

interface BetPanelProps {
  yesPrice: number;
  noPrice: number;
  onBet: (outcome: boolean, amount: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  error?: Error | null;
}

export function BetPanel({ yesPrice, noPrice, onBet, disabled, isLoading, error }: BetPanelProps) {
  const { isConnected } = useAccount();
  const { price: ethPrice } = useEthPrice();
  const [amount, setAmount] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);

  const amountNum = parseFloat(amount) || 0;
  
  const selectedPrice = selectedOutcome === true ? yesPrice : selectedOutcome === false ? noPrice : 0.5;
  const potentialReturn = amountNum > 0 && selectedPrice > 0 ? (amountNum / selectedPrice).toFixed(4) : "0.00";
  const potentialProfit = amountNum > 0 && selectedPrice > 0 ? ((amountNum / selectedPrice) - amountNum).toFixed(4) : "0.00";

  const amountUSD = ethPrice && amount
    ? (parseFloat(amount) * ethPrice).toFixed(2)
    : null;

  const handleBet = () => {
    if (amount && amountNum > 0 && selectedOutcome !== null) {
      onBet(selectedOutcome, amount);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">
          Place Your Bet
        </h3>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-slate-400">
          Select Outcome
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedOutcome(true)}
            disabled={disabled}
            className={cn(
              "relative rounded-xl p-4 text-center transition-all border-2",
              selectedOutcome === true
                ? "border-emerald-500 bg-emerald-500/20 ring-1 ring-emerald-500/50"
                : "border-slate-700 bg-slate-800/50 hover:border-emerald-500/50"
            )}
          >
            <div className="text-3xl font-bold text-emerald-400">{(yesPrice * 100).toFixed(0)}%</div>
            <div className="text-lg font-semibold text-emerald-400">YES</div>
            <div className="text-xs text-slate-500 mt-1">Bet this will happen</div>
            {selectedOutcome === true && (
              <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSelectedOutcome(false)}
            disabled={disabled}
            className={cn(
              "relative rounded-xl p-4 text-center transition-all border-2",
              selectedOutcome === false
                ? "border-rose-500 bg-rose-500/20 ring-1 ring-rose-500/50"
                : "border-slate-700 bg-slate-800/50 hover:border-rose-500/50"
            )}
          >
            <div className="text-3xl font-bold text-rose-400">{(noPrice * 100).toFixed(0)}%</div>
            <div className="text-lg font-semibold text-rose-400">NO</div>
            <div className="text-xs text-slate-500 mt-1">Bet this won't happen</div>
            {selectedOutcome === false && (
              <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-slate-400">
          Bet Amount (ETH)
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={disabled}
            step="0.001"
            min="0"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-lg font-medium text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
            ETH
          </div>
        </div>
        {amountUSD && (
          <div className="mt-1 text-xs text-slate-500">
            ≈ ${amountUSD}
          </div>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {["0.01", "0.05", "0.1", "0.5"].map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(preset)}
            disabled={disabled}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300 disabled:opacity-50"
          >
            {preset}
          </button>
        ))}
      </div>

      {selectedOutcome !== null && amountNum > 0 && (
        <div className={cn(
          "mb-4 rounded-xl p-4 border",
          selectedOutcome ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">If {selectedOutcome ? "YES" : "NO"} wins:</span>
            <span className={cn(
              "text-lg font-bold",
              selectedOutcome ? "text-emerald-400" : "text-rose-400"
            )}>
              {potentialReturn} ETH
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Potential profit:</span>
            <span className={cn(
              "text-sm font-semibold",
              selectedOutcome ? "text-emerald-400" : "text-rose-400"
            )}>
              +{potentialProfit} ETH
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700/50">
            <div className="text-xs text-slate-500">
              If {selectedOutcome ? "NO" : "YES"} wins: <span className="text-red-400">You lose {amount} ETH</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-sm text-red-400">{error.message}</p>
        </div>
      )}

      <button
        onClick={handleBet}
        disabled={disabled || !isConnected || !amount || amountNum <= 0 || selectedOutcome === null || isLoading}
        className={cn(
          "w-full rounded-xl py-4 text-lg font-semibold transition-all",
          selectedOutcome === true && "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600",
          selectedOutcome === false && "bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600",
          selectedOutcome === null && "bg-gradient-to-r from-indigo-500 to-purple-500 text-white",
          (disabled || !isConnected || !amount || amountNum <= 0 || selectedOutcome === null || isLoading || !canBet) &&
            "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Placing Bet...
          </span>
        ) : !isConnected ? (
          "Connect Wallet"
        ) : selectedOutcome === null ? (
          "Select YES or NO"
        ) : !amount ? (
          "Enter Amount"
        ) : (
          `Bet ${amount} ETH on ${selectedOutcome ? "YES" : "NO"}`
        )}
      </button>
    </div>
  );
}
