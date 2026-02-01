"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { keccak256, encodePacked, toHex } from "viem";
import { cn } from "@/lib/utils";

interface PrivateBetPanelProps {
  batchEndTime: number;
  revealEndTime: number;
  onCommit: (commitHash: `0x${string}`, amount: string, salt: `0x${string}`, outcome: boolean) => void;
  onReveal: (outcome: boolean, salt: `0x${string}`) => void;
  hasCommitment?: boolean;
  isRevealed?: boolean;
  disabled?: boolean;
}

type Phase = "commit" | "reveal" | "settled";

export function PrivateBetPanel({
  batchEndTime,
  revealEndTime,
  onCommit,
  onReveal,
  hasCommitment,
  isRevealed,
  disabled,
}: PrivateBetPanelProps) {
  const { address, isConnected } = useAccount();
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);
  const [amount, setAmount] = useState("");
  const [salt, setSalt] = useState<`0x${string}` | null>(null);
  const [savedOutcome, setSavedOutcome] = useState<boolean | null>(null);

  const now = Date.now() / 1000;
  const phase: Phase =
    now < batchEndTime ? "commit" : now < revealEndTime ? "reveal" : "settled";

  const generateSalt = (): `0x${string}` => {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return toHex(randomBytes);
  };

  const generateCommitHash = (outcome: boolean, saltValue: `0x${string}`): `0x${string}` => {
    if (!address) return "0x";
    return keccak256(encodePacked(["bool", "bytes32", "address"], [outcome, saltValue, address]));
  };

  const handleCommit = () => {
    if (selectedOutcome === null || !amount || !address) return;

    const newSalt = generateSalt();
    const commitHash = generateCommitHash(selectedOutcome, newSalt);

    setSalt(newSalt);
    setSavedOutcome(selectedOutcome);

    onCommit(commitHash, amount, newSalt, selectedOutcome);
  };

  const handleReveal = () => {
    if (salt === null || savedOutcome === null) return;
    onReveal(savedOutcome, salt);
  };

  const timeRemaining = phase === "commit" 
    ? batchEndTime - now 
    : phase === "reveal" 
    ? revealEndTime - now 
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Private Bet</h3>
        <div className={cn(
          "rounded-full px-3 py-1 text-xs font-medium",
          phase === "commit" && "bg-indigo-500/10 text-indigo-400",
          phase === "reveal" && "bg-amber-500/10 text-amber-400",
          phase === "settled" && "bg-emerald-500/10 text-emerald-400"
        )}>
          {phase === "commit" && `Commit: ${formatTime(timeRemaining)}`}
          {phase === "reveal" && `Reveal: ${formatTime(timeRemaining)}`}
          {phase === "settled" && "Settled"}
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-slate-800/30 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <span className="text-xs text-indigo-400">i</span>
          </div>
          <div className="text-sm text-slate-400">
            <p className="font-medium text-slate-300 mb-1">Privacy Protected</p>
            <p>Your bet direction (YES/NO) is hidden until the reveal phase. No one can front-run your position.</p>
          </div>
        </div>
      </div>

      {phase === "commit" && !hasCommitment && (
        <>
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
              <div className="text-xl font-bold">YES</div>
              <div className="text-xs font-medium opacity-80">Hidden</div>
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
              <div className="text-xl font-bold">NO</div>
              <div className="text-xs font-medium opacity-80">Hidden</div>
            </button>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-400">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={disabled}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-lg font-medium text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleCommit}
            disabled={disabled || !isConnected || selectedOutcome === null || !amount}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 text-lg font-semibold text-white transition-all hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isConnected ? "Connect Wallet" : "Commit Hidden Bet"}
          </button>
        </>
      )}

      {phase === "commit" && hasCommitment && (
        <div className="text-center py-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-100">Bet Committed</p>
          <p className="mt-1 text-sm text-slate-400">
            Wait for reveal phase to complete your bet
          </p>
          <p className="mt-4 text-xs text-slate-500 font-mono">
            Keep this page open - you'll need your secret to reveal
          </p>
        </div>
      )}

      {phase === "reveal" && hasCommitment && !isRevealed && (
        <div className="text-center py-4">
          <p className="mb-4 text-slate-300">Reveal phase is open. Complete your bet now.</p>
          <button
            onClick={handleReveal}
            disabled={disabled || salt === null}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-lg font-semibold text-white transition-all hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reveal Bet
          </button>
          {salt === null && (
            <p className="mt-2 text-xs text-rose-400">
              Secret not found. Did you commit from this browser?
            </p>
          )}
        </div>
      )}

      {phase === "reveal" && hasCommitment && isRevealed && (
        <div className="text-center py-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-100">Bet Revealed</p>
          <p className="mt-1 text-sm text-slate-400">
            Your bet will be settled with the batch
          </p>
        </div>
      )}

      {phase === "reveal" && !hasCommitment && (
        <div className="text-center py-8 text-slate-400">
          <p>Commit phase ended. Wait for the next batch.</p>
        </div>
      )}

      {phase === "settled" && (
        <div className="text-center py-8 text-slate-400">
          <p className="text-lg font-medium text-slate-100">Batch Settled</p>
          <p className="mt-1">Check your positions for results.</p>
        </div>
      )}
    </div>
  );
}

