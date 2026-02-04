"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { usePrivateBetting, PoolKey } from "@/hooks/usePrivateBetting";
import { formatEther } from "viem";

interface PrivateBetPanelProps {
  poolKey?: PoolKey;
  disabled?: boolean;
}

export function PrivateBetPanel({ poolKey, disabled }: PrivateBetPanelProps) {
  const { address, isConnected } = useAccount();
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);
  const [amount, setAmount] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);

  const {
    commitBet,
    revealBet,
    claimWinnings,
    clearErrors,
    batchInfo,
    commitment,
    market,
    storedBetData,
    getPhase,
    getTimeRemaining,
    isCommitting,
    isRevealing,
    isClaiming,
    isCommitSuccess,
    isRevealSuccess,
    isClaimSuccess,
    error,
    isContractDeployed,
    BATCH_DURATION,
    REVEAL_WINDOW,
  } = usePrivateBetting(poolKey);

  const phase = getPhase();
  const hasCommitment =
    commitment &&
    commitment.commitHash !==
      "0x0000000000000000000000000000000000000000000000000000000000000000";
  const isRevealed = commitment?.revealed;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [getTimeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCommit = async () => {
    if (selectedOutcome === null || !amount || !address) return;
    try {
      await commitBet(amount, selectedOutcome);
    } catch (err) {
      console.error("Commit failed:", err);
    }
  };

  const handleReveal = async () => {
    try {
      await revealBet();
    } catch (err) {
      console.error("Reveal failed:", err);
    }
  };

  const handleClaim = async () => {
    try {
      await claimWinnings();
    } catch (err) {
      console.error("Claim failed:", err);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Private Bet</h3>
        <div
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            phase === "commit" && "bg-indigo-500/10 text-indigo-400",
            phase === "reveal" && "bg-amber-500/10 text-amber-400",
            phase === "settled" && "bg-emerald-500/10 text-emerald-400"
          )}
        >
          {phase === "commit" && `Commit: ${formatTime(timeRemaining)}`}
          {phase === "reveal" && `Reveal: ${formatTime(timeRemaining)}`}
          {phase === "settled" && "Settled"}
        </div>
      </div>

      {!isContractDeployed && (
        <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-medium">Demo Mode</span>
            <span className="text-amber-400/60">- Contract not yet deployed</span>
          </div>
        </div>
      )}

      <div className="mb-4 rounded-xl bg-slate-800/30 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <span className="text-xs text-indigo-400">i</span>
          </div>
          <div className="text-sm text-slate-400">
            <p className="font-medium text-slate-300 mb-1">Privacy Protected</p>
            <p>
              Your bet direction (YES/NO) is hidden until the reveal phase. No
              one can front-run your position.
            </p>
          </div>
        </div>
      </div>

      {batchInfo && (
        <div className="mb-4 rounded-xl bg-slate-800/30 p-3">
          <div className="text-xs text-slate-500 mb-2">Current Batch Stats</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">YES Volume:</span>
              <span className="text-emerald-400 font-mono">
                {formatEther(batchInfo.totalYesAmount)} ETH
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">NO Volume:</span>
              <span className="text-rose-400 font-mono">
                {formatEther(batchInfo.totalNoAmount)} ETH
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">YES Bets:</span>
              <span className="text-slate-300">{batchInfo.yesCount.toString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">NO Bets:</span>
              <span className="text-slate-300">{batchInfo.noCount.toString()}</span>
            </div>
          </div>
        </div>
      )}

      {phase === "commit" && !hasCommitment && (
        <>
          <div className="mb-4 flex gap-3">
            <button
              onClick={() => setSelectedOutcome(true)}
              disabled={disabled || isCommitting}
              className={cn(
                "flex-1 rounded-xl p-4 text-center transition-all",
                selectedOutcome === true
                  ? "bg-emerald-500 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900"
                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
                (disabled || isCommitting) && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="text-xl font-bold">YES</div>
              <div className="text-xs font-medium opacity-80">Hidden</div>
            </button>
            <button
              onClick={() => setSelectedOutcome(false)}
              disabled={disabled || isCommitting}
              className={cn(
                "flex-1 rounded-xl p-4 text-center transition-all",
                selectedOutcome === false
                  ? "bg-rose-500 text-white ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900"
                  : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20",
                (disabled || isCommitting) && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="text-xl font-bold">NO</div>
              <div className="text-xs font-medium opacity-80">Hidden</div>
            </button>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-400">
              Amount (ETH)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={disabled || isCommitting}
              step="0.001"
              min="0"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-lg font-medium text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="mb-4 flex gap-2">
            {["0.01", "0.05", "0.1", "0.5"].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                disabled={disabled || isCommitting}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300 disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">{error.message}</p>
            </div>
          )}

          <button
            onClick={handleCommit}
            disabled={
              disabled ||
              !isConnected ||
              selectedOutcome === null ||
              !amount ||
              isCommitting
            }
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 text-lg font-semibold text-white transition-all hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCommitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Committing...
              </span>
            ) : !isConnected ? (
              "Connect Wallet"
            ) : (
              "Commit Hidden Bet"
            )}
          </button>
        </>
      )}

      {phase === "commit" && hasCommitment && (
        <div className="text-center py-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <svg
              className="h-8 w-8 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-100">Bet Committed</p>
          <p className="mt-1 text-sm text-slate-400">
            Wait for reveal phase to complete your bet
          </p>
          {storedBetData && (
            <div className="mt-4 rounded-lg bg-slate-800/50 p-3">
              <div className="text-xs text-slate-500 mb-1">Your commitment</div>
              <div className="text-sm text-slate-300">
                {storedBetData.outcome ? "YES" : "NO"} • {storedBetData.amount} ETH
              </div>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500 font-mono">
            Keep this page open - you'll need your secret to reveal
          </p>
        </div>
      )}

      {phase === "reveal" && hasCommitment && !isRevealed && (
        <div className="text-center py-4">
          <p className="mb-4 text-slate-300">
            Reveal phase is open. Complete your bet now.
          </p>
          {storedBetData && (
            <div className="mb-4 rounded-lg bg-slate-800/50 p-3">
              <div className="text-xs text-slate-500 mb-1">Revealing</div>
              <div className="text-sm text-slate-300">
                {storedBetData.outcome ? "YES" : "NO"} • {storedBetData.amount} ETH
              </div>
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">{error.message}</p>
            </div>
          )}
          <button
            onClick={handleReveal}
            disabled={disabled || !storedBetData || isRevealing}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-lg font-semibold text-white transition-all hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRevealing ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Revealing...
              </span>
            ) : (
              "Reveal Bet"
            )}
          </button>
          {!storedBetData && (
            <p className="mt-2 text-xs text-rose-400">
              Secret not found. Did you commit from this browser?
            </p>
          )}
        </div>
      )}

      {phase === "reveal" && hasCommitment && isRevealed && (
        <div className="text-center py-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <svg
              className="h-8 w-8 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
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
        <div className="text-center py-4">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <svg
              className="h-8 w-8 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-100 mb-2">Batch Settled</p>
          {market?.resolved && (
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-4",
                market.outcome
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-rose-500/10 text-rose-400"
              )}
            >
              Market Resolved: {market.outcome ? "YES" : "NO"}
            </div>
          )}
          {storedBetData && market?.resolved && (
            <>
              {error && (
                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-sm text-red-400">{error.message}</p>
                </div>
              )}
              <button
                onClick={handleClaim}
                disabled={disabled || isClaiming}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-4 text-lg font-semibold text-white transition-all hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClaiming ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Claiming...
                  </span>
                ) : (
                  "Claim Winnings"
                )}
              </button>
            </>
          )}
          {!storedBetData && (
            <p className="mt-1 text-sm text-slate-400">
              Check your positions for results.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-800/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Commit: {BATCH_DURATION / 60}min</span>
          <span>•</span>
          <span>Reveal: {REVEAL_WINDOW / 60}min</span>
          <span>•</span>
          <span>Settlement: Instant</span>
        </div>
      </div>
    </div>
  );
}
