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
  const [showInfo, setShowInfo] = useState(true);

  const amountNum = parseFloat(amount) || 0;
  const yesReturn = amountNum > 0 ? (amountNum / yesPrice).toFixed(4) : "0.00";
  const noReturn = amountNum > 0 ? (amountNum / noPrice).toFixed(4) : "0.00";

  const amountUSD = ethPrice && amount
    ? (parseFloat(amount) * ethPrice).toFixed(2)
    : null;

  const handleBet = () => {
    if (amount && amountNum > 0) {
      onBet(true, amount);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Buy Position</h3>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700/50 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-300"
        >
          <span className="text-xs font-bold">?</span>
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3">
          <p className="text-xs text-indigo-300 leading-relaxed">
            <strong>How it works:</strong> When you buy a position, you receive <span className="text-emerald-400">YES</span> and <span className="text-rose-400">NO</span> tokens equally. 
            Hold the tokens for the outcome you believe in. When the market resolves, winning tokens can be redeemed for ETH.
          </p>
        </div>
      )}

      <div className="mb-4 flex gap-3">
        <div className="flex-1 rounded-xl bg-emerald-500/10 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{(yesPrice * 100).toFixed(0)}%</div>
          <div className="text-sm font-medium text-emerald-400/60">YES odds</div>
        </div>
        <div className="flex-1 rounded-xl bg-rose-500/10 p-4 text-center">
          <div className="text-2xl font-bold text-rose-400">{(noPrice * 100).toFixed(0)}%</div>
          <div className="text-sm font-medium text-rose-400/60">NO odds</div>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-slate-400">
          Amount (ETH)
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
            {preset} ETH
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl bg-slate-800/30 p-4">
        <div className="text-xs text-slate-500 mb-3">You'll receive both tokens. Returns if market resolves:</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
            <div className="text-xs text-emerald-400/60 mb-1">If YES wins</div>
            <div className="font-mono font-semibold text-emerald-400">{yesReturn} ETH</div>
          </div>
          <div className="rounded-lg bg-rose-500/10 p-3 text-center">
            <div className="text-xs text-rose-400/60 mb-1">If NO wins</div>
            <div className="font-mono font-semibold text-rose-400">{noReturn} ETH</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-sm text-red-400">{error.message}</p>
        </div>
      )}

      <button
        onClick={handleBet}
        disabled={disabled || !isConnected || !amount || amountNum <= 0 || isLoading}
        className={cn(
          "w-full rounded-xl py-4 text-lg font-semibold transition-all",
          "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600",
          (disabled || !isConnected || !amount || amountNum <= 0 || isLoading) &&
            "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Buying Position...
          </span>
        ) : !isConnected ? (
          "Connect Wallet"
        ) : !amount ? (
          "Enter Amount"
        ) : (
          `Buy ${amount} ETH Position`
        )}
      </button>
    </div>
  );
}

