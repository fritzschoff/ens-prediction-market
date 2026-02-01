"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

export default function CreateMarketPage() {
  const { isConnected } = useAccount();
  const [question, setQuestion] = useState("");
  const [ensName, setEnsName] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");
  const [criteria, setCriteria] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating market:", { question, ensName, expiryDays, criteria });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gradient">Create Market</h1>
        <p className="text-slate-400">
          Create a new prediction market with an ENS name for easy discovery.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6 rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will ETH reach $10,000 by end of 2026?"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              ENS Name
            </label>
            <div className="flex">
              <input
                type="text"
                value={ensName}
                onChange={(e) => setEnsName(e.target.value)}
                placeholder="eth-10k"
                className="flex-1 rounded-l-xl border border-r-0 border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex items-center rounded-r-xl border border-slate-700 bg-slate-800 px-4 text-slate-400">
                .predict.eth
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              This name will be used to identify your market on ENS
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Expiry
            </label>
            <div className="grid grid-cols-4 gap-3">
              {["7", "30", "90", "365"].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setExpiryDays(days)}
                  className={`rounded-xl border py-3 text-sm font-medium transition-colors ${
                    expiryDays === days
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                      : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {days === "365" ? "1 year" : `${days} days`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Resolution Criteria
            </label>
            <textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Describe how and when this market will be resolved..."
              rows={4}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="rounded-xl bg-slate-800/30 p-4">
            <h3 className="mb-3 text-sm font-medium text-slate-300">
              Market Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Creation Fee</span>
                <span className="text-slate-300">0.01 ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Initial Liquidity</span>
                <span className="text-slate-300">100 USDC (required)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ENS Registration</span>
                <span className="text-slate-300">~0.005 ETH</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isConnected || !question || !ensName || !criteria}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 text-lg font-semibold text-white transition-all hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isConnected ? "Connect Wallet" : "Create Market"}
          </button>
        </div>
      </form>

      <div className="mt-8 rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          How it works
        </h3>
        <ol className="space-y-4 text-sm text-slate-400">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-400">
              1
            </span>
            <span>
              Create your market with a clear question and resolution criteria
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-400">
              2
            </span>
            <span>
              Register an ENS name for your market to make it discoverable
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-400">
              3
            </span>
            <span>
              Provide initial liquidity to enable trading on your market
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-400">
              4
            </span>
            <span>
              When the market expires, resolve it based on your criteria
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}

