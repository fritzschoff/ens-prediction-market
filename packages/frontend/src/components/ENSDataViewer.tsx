"use client";

import { useState } from "react";
import { Address } from "viem";

interface ENSDataViewerProps {
  ensName: string;
  records: {
    pool?: Address;
    oracle?: Address;
    expiry?: number;
    criteria?: string;
    yesToken?: Address;
    noToken?: Address;
    creator?: string;
    marketId?: string;
  };
}

const RECORD_LABELS: Record<string, { label: string; color: string }> = {
  pool: { label: "Pool Address", color: "text-cyan-400" },
  oracle: { label: "Oracle", color: "text-amber-400" },
  expiry: { label: "Expiry", color: "text-rose-400" },
  criteria: { label: "Resolution Criteria", color: "text-emerald-400" },
  yesToken: { label: "YES Token", color: "text-green-400" },
  noToken: { label: "NO Token", color: "text-red-400" },
  creator: { label: "Creator", color: "text-purple-400" },
  marketId: { label: "Market ID", color: "text-indigo-400" },
};

function shortenValue(value: string, maxLength = 16): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function ENSDataViewer({ ensName, records }: ENSDataViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const recordEntries = Object.entries(records).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-slate-900/50 to-indigo-500/5 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            <svg
              className="h-5 w-5 text-violet-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 7V4h16v3M9 20h6M12 4v16" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-xs text-violet-400/60 font-medium uppercase tracking-wider">
              ENS Data Storage
            </div>
            <div className="text-sm font-semibold text-slate-200">
              How we store market data on-chain
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {recordEntries.length} records
          </span>
          <svg
            className={`h-5 w-5 text-slate-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-700/50 p-4 space-y-4">
          <div className="rounded-xl bg-slate-800/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs font-medium text-violet-400">
                ENS SUBDOMAIN
              </span>
            </div>
            <div className="font-mono text-lg text-slate-100 break-all">
              {ensName}
            </div>
            <a
              href={`https://app.ens.domains/${ensName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              View on ENS
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13z"
                clipRule="evenodd"
              />
            </svg>
            <span>Text Records stored in ENS Public Resolver</span>
          </div>

          <div className="space-y-2">
            {recordEntries.map(([key, value]) => {
              const config = RECORD_LABELS[key] || {
                label: key,
                color: "text-slate-400",
              };
              const displayValue =
                key === "expiry"
                  ? new Date((value as number) * 1000).toLocaleString()
                  : key === "criteria"
                  ? String(value)
                  : shortenValue(String(value));

              return (
                <div
                  key={key}
                  className="group flex items-start gap-3 rounded-lg bg-slate-800/30 p-3 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-24">
                    <span className={`text-xs font-medium ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-slate-300 break-all">
                      {displayValue}
                    </div>
                    {key !== "expiry" &&
                      key !== "criteria" &&
                      String(value).length > 16 && (
                        <button
                          onClick={() => navigator.clipboard.writeText(String(value))}
                          className="mt-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          Copy full value
                        </button>
                      )}
                  </div>
                  <div className="flex-shrink-0">
                    <div className="px-2 py-1 rounded bg-slate-700/50 text-xs text-slate-500 font-mono">
                      {key}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20">
                <svg
                  className="h-3.5 w-3.5 text-violet-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-sm text-slate-400">
                <p className="font-medium text-slate-300 mb-1">
                  Why ENS for data storage?
                </p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-violet-400" />
                    Human-readable market identifiers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-violet-400" />
                    Decentralized & censorship-resistant
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-violet-400" />
                    Easy discoverability & sharing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-violet-400" />
                    Immutable audit trail
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

