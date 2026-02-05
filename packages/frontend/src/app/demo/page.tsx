"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import Link from "next/link";

type DemoStep = "create" | "bet" | "claim";
type DemoMode = "mock" | "live";

interface StepConfig {
  id: DemoStep;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: StepConfig[] = [
  {
    id: "create",
    title: "Create a Market",
    description: "Register an ENS subdomain and create a prediction market",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 4v16m-8-8h16" />
      </svg>
    ),
  },
  {
    id: "bet",
    title: "Place a Bet",
    description: "Buy YES or NO tokens to take a position",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "claim",
    title: "Claim Winnings",
    description: "Redeem your winning tokens for collateral",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const MOCK_MARKET = {
  ensName: "ethglobal-demo.predict.eth",
  question: "Will ETH reach $10,000 by end of 2026?",
  creator: "0xA8DF...7CC",
  oracle: "0xA8DF...7CC",
  expiry: Math.floor(Date.now() / 1000) + 86400 * 365,
  yesPrice: 0.65,
  noPrice: 0.35,
  yesToken: "0x1234...5678",
  noToken: "0x9876...5432",
  pool: "0x3e59...a3c0",
  totalVolume: "12.5 ETH",
};

export default function DemoPage() {
  const { isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState<DemoStep>("create");
  const [mode, setMode] = useState<DemoMode>("mock");
  const [mockAnimating, setMockAnimating] = useState(false);
  const [mockProgress, setMockProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<DemoStep>>(new Set());

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const simulateMockAction = async () => {
    setMockAnimating(true);
    setMockProgress(0);
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200));
      setMockProgress(i);
    }
    
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setMockAnimating(false);
    
    if (currentStepIndex < STEPS.length - 1) {
      setTimeout(() => setCurrentStep(STEPS[currentStepIndex + 1].id), 500);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-2 text-sm font-medium text-amber-400 mb-4">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Hackathon Demo
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          <span className="text-gradient">ENS Prediction Markets</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-400">
          A complete walkthrough of our privacy-preserving prediction market platform
          built on Uniswap v4 with ENS integration.
        </p>
      </div>

      <div className="mb-8 flex items-center justify-center gap-4">
        <div className="inline-flex rounded-xl bg-slate-800/50 p-1">
          <button
            onClick={() => setMode("mock")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              mode === "mock"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Demo Mode
          </button>
          <button
            onClick={() => setMode("live")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              mode === "live"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Live Mode
          </button>
        </div>
        {mode === "live" && !isConnected && (
          <ConnectButton />
        )}
      </div>

      <div className="mb-12 flex justify-center">
        <div className="flex items-center gap-2">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                  currentStep === step.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white ring-4 ring-indigo-500/30"
                    : completedSteps.has(step.id)
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                )}
              >
                {completedSteps.has(step.id) ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{idx + 1}</span>
                )}
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 mx-2 transition-colors",
                    completedSteps.has(step.id) ? "bg-emerald-500" : "bg-slate-700"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {currentStep === "create" && (
            <CreateMarketDemo
              mode={mode}
              isAnimating={mockAnimating}
              progress={mockProgress}
              onSimulate={simulateMockAction}
              isConnected={isConnected}
            />
          )}
          {currentStep === "bet" && (
            <PlaceBetDemo
              mode={mode}
              isAnimating={mockAnimating}
              progress={mockProgress}
              onSimulate={simulateMockAction}
              isConnected={isConnected}
            />
          )}
          {currentStep === "claim" && (
            <ClaimWinningsDemo
              mode={mode}
              isAnimating={mockAnimating}
              progress={mockProgress}
              onSimulate={simulateMockAction}
              isConnected={isConnected}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Demo Progress</h3>
            <div className="space-y-3">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-3 transition-colors",
                    currentStep === step.id
                      ? "bg-indigo-500/10 border border-indigo-500/30"
                      : completedSteps.has(step.id)
                      ? "bg-emerald-500/10"
                      : "bg-slate-800/30"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      currentStep === step.id
                        ? "bg-indigo-500/20 text-indigo-400"
                        : completedSteps.has(step.id)
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-700 text-slate-500"
                    )}
                  >
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        currentStep === step.id
                          ? "text-indigo-300"
                          : completedSteps.has(step.id)
                          ? "text-emerald-300"
                          : "text-slate-400"
                      )}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {step.description}
                    </div>
                  </div>
                  {completedSteps.has(step.id) && (
                    <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Sample Market</h3>
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-800/50 p-3">
                <div className="text-xs text-indigo-400 mb-1">ENS Name</div>
                <div className="font-mono text-sm text-slate-200">{MOCK_MARKET.ensName}</div>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-3">
                <div className="text-xs text-slate-500 mb-1">Question</div>
                <div className="text-sm text-slate-300">{MOCK_MARKET.question}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    {(MOCK_MARKET.yesPrice * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-emerald-400/60">YES</div>
                </div>
                <div className="rounded-lg bg-rose-500/10 p-3 text-center">
                  <div className="text-2xl font-bold text-rose-400">
                    {(MOCK_MARKET.noPrice * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-rose-400/60">NO</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-amber-300 mb-1">Hackathon Judges</h4>
                <p className="text-sm text-slate-400">
                  Switch to <span className="text-amber-400">Live Mode</span> and connect your wallet 
                  to test with real testnet transactions!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <TechCard
          title="Uniswap v4 Hooks"
          description="Custom prediction market logic through beforeSwap and afterSwap hooks"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          }
          color="pink"
        />
        <TechCard
          title="ENS Integration"
          description="Human-readable market names with on-chain text record storage"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7V4h16v3M9 20h6M12 4v16" />
            </svg>
          }
          color="violet"
        />
        <TechCard
          title="Privacy DeFi"
          description="Commit-reveal mechanism for MEV-protected betting"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          }
          color="emerald"
        />
      </div>
    </div>
  );
}

function TechCard({
  title,
  description,
  icon,
  color,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "pink" | "violet" | "emerald";
}) {
  const colorClasses = {
    pink: "from-pink-500/10 to-rose-500/10 border-pink-500/20 text-pink-400",
    violet: "from-violet-500/10 to-indigo-500/10 border-violet-500/20 text-violet-400",
    emerald: "from-emerald-500/10 to-green-500/10 border-emerald-500/20 text-emerald-400",
  };

  return (
    <div className={cn("rounded-2xl border bg-gradient-to-br p-6", colorClasses[color])}>
      <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-current/20", colorClasses[color])}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

function CreateMarketDemo({
  mode,
  isAnimating,
  progress,
  onSimulate,
  isConnected,
}: {
  mode: DemoMode;
  isAnimating: boolean;
  progress: number;
  onSimulate: () => void;
  isConnected: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Step 1: Create a Market</h2>
        <p className="text-slate-400 mb-6">
          When you create a market, we register an ENS subdomain and store all market 
          metadata as text records. This makes markets discoverable and verifiable.
        </p>

        <div className="rounded-xl bg-slate-800/50 p-4 mb-6">
          <div className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">
            Blockchain Actions
          </div>
          <div className="space-y-3">
            {[
              { label: "1. Check subdomain availability", detail: "ENS Registry" },
              { label: "2. Create market contract", detail: "MarketFactory.createMarket()" },
              { label: "3. Claim ENS subdomain", detail: "ENS Registry.setSubnodeRecord()" },
              { label: "4. Set text records", detail: "PublicResolver.multicall(setText...)" },
            ].map((action, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3 transition-all",
                  isAnimating && progress >= (idx + 1) * 25
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-slate-700/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    isAnimating && progress >= (idx + 1) * 25
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-600 text-slate-400"
                  )}
                >
                  {isAnimating && progress >= (idx + 1) * 25 ? "✓" : idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-200">{action.label}</div>
                  <div className="text-xs text-slate-500 font-mono">{action.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
              <svg className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-indigo-300 mb-1">ENS Text Records</h4>
              <p className="text-xs text-slate-400">
                We store: pool address, oracle, expiry, resolution criteria, YES/NO token addresses, 
                creator, and market ID - all queryable on-chain!
              </p>
            </div>
          </div>
        </div>

        {mode === "mock" ? (
          <button
            onClick={onSimulate}
            disabled={isAnimating}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 text-lg font-semibold text-white transition-all hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50"
          >
            {isAnimating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating Market... {progress}%
              </span>
            ) : (
              "Simulate Market Creation"
            )}
          </button>
        ) : (
          <Link
            href="/create"
            className="block w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 text-center text-lg font-semibold text-white transition-all hover:from-indigo-600 hover:to-purple-600"
          >
            {isConnected ? "Go to Create Market" : "Connect Wallet First"}
          </Link>
        )}
      </div>
    </div>
  );
}

function PlaceBetDemo({
  mode,
  isAnimating,
  progress,
  onSimulate,
  isConnected,
}: {
  mode: DemoMode;
  isAnimating: boolean;
  progress: number;
  onSimulate: () => void;
  isConnected: boolean;
}) {
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Step 2: Place a Bet</h2>
        <p className="text-slate-400 mb-6">
          Buy outcome tokens by sending ETH to the prediction hook. Your position is 
          visible on-chain immediately.
        </p>

        <div className="mb-6">
          <div className="text-sm font-medium text-slate-400 mb-3">Select your position:</div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedOutcome(true)}
              className={cn(
                "rounded-xl p-6 text-center transition-all border-2",
                selectedOutcome === true
                  ? "border-emerald-500 bg-emerald-500/20"
                  : "border-slate-700 bg-slate-800/50 hover:border-emerald-500/50"
              )}
            >
              <div className="text-4xl font-bold text-emerald-400">65%</div>
              <div className="text-lg font-semibold text-emerald-400 mt-1">YES</div>
              <div className="text-xs text-slate-500 mt-2">0.1 ETH → 0.154 YES tokens</div>
            </button>
            <button
              onClick={() => setSelectedOutcome(false)}
              className={cn(
                "rounded-xl p-6 text-center transition-all border-2",
                selectedOutcome === false
                  ? "border-rose-500 bg-rose-500/20"
                  : "border-slate-700 bg-slate-800/50 hover:border-rose-500/50"
              )}
            >
              <div className="text-4xl font-bold text-rose-400">35%</div>
              <div className="text-lg font-semibold text-rose-400 mt-1">NO</div>
              <div className="text-xs text-slate-500 mt-2">0.1 ETH → 0.286 NO tokens</div>
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 p-4 mb-6">
          <div className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">
            Transaction Flow
          </div>
          <div className="space-y-2">
            {[
              { label: "Send ETH to PredictionHook", detail: "betOnOutcome(poolKey, outcome)" },
              { label: "Mint outcome tokens", detail: `OutcomeToken.mint(user, amount)` },
              { label: "Update market stats", detail: "totalCollateral += amount" },
            ].map((action, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3",
                  isAnimating && progress >= (idx + 1) * 33
                    ? "bg-emerald-500/10"
                    : "bg-slate-700/50"
                )}
              >
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isAnimating && progress >= (idx + 1) * 33
                      ? "bg-emerald-400"
                      : "bg-slate-500"
                  )}
                />
                <div className="flex-1">
                  <div className="text-sm text-slate-200">{action.label}</div>
                  <div className="text-xs text-slate-500 font-mono">{action.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {mode === "mock" ? (
          <button
            onClick={onSimulate}
            disabled={isAnimating || selectedOutcome === null}
            className={cn(
              "w-full rounded-xl py-4 text-lg font-semibold text-white transition-all",
              selectedOutcome === true
                ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                : selectedOutcome === false
                ? "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600"
                : "bg-slate-600",
              (isAnimating || selectedOutcome === null) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isAnimating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Placing Bet... {progress}%
              </span>
            ) : selectedOutcome === null ? (
              "Select YES or NO"
            ) : (
              `Simulate Bet on ${selectedOutcome ? "YES" : "NO"}`
            )}
          </button>
        ) : (
          <Link
            href="/"
            className="block w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 text-center text-lg font-semibold text-white transition-all hover:from-indigo-600 hover:to-purple-600"
          >
            {isConnected ? "Go to Markets" : "Connect Wallet First"}
          </Link>
        )}
      </div>
    </div>
  );
}

function ClaimWinningsDemo({
  mode,
  isAnimating,
  progress,
  onSimulate,
  isConnected,
}: {
  mode: DemoMode;
  isAnimating: boolean;
  progress: number;
  onSimulate: () => void;
  isConnected: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Step 3: Claim Winnings</h2>
        <p className="text-slate-400 mb-6">
          After the market resolves, burn your winning tokens to claim the proportional 
          share of the collateral pool.
        </p>

        <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-sm text-emerald-400/60 mb-1">Market Resolved</div>
            <div className="text-4xl font-bold text-emerald-400">YES ✓</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-800/50 p-4 text-center">
              <div className="text-xs text-slate-500 mb-1">Your YES Tokens</div>
              <div className="text-2xl font-bold text-emerald-400">1.54</div>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-4 text-center">
              <div className="text-xs text-slate-500 mb-1">Claimable ETH</div>
              <div className="text-2xl font-bold text-white">1.54 ETH</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 p-4 mb-6">
          <div className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">
            Redemption Process
          </div>
          <div className="space-y-2">
            {[
              { label: "Verify market is resolved", detail: "market.resolved == true" },
              { label: "Burn winning tokens", detail: "OutcomeToken.burn(user, balance)" },
              { label: "Transfer ETH to user", detail: "user.call{value: balance}()" },
            ].map((action, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3",
                  isAnimating && progress >= (idx + 1) * 33
                    ? "bg-emerald-500/10"
                    : "bg-slate-700/50"
                )}
              >
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isAnimating && progress >= (idx + 1) * 33
                      ? "bg-emerald-400"
                      : "bg-slate-500"
                  )}
                />
                <div className="flex-1">
                  <div className="text-sm text-slate-200">{action.label}</div>
                  <div className="text-xs text-slate-500 font-mono">{action.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-amber-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-amber-300 mb-1">Important</h4>
              <p className="text-xs text-slate-400">
                Only the oracle (market creator) can resolve the market after expiry. 
                Losing tokens become worthless and cannot be redeemed.
              </p>
            </div>
          </div>
        </div>

        {mode === "mock" ? (
          <button
            onClick={onSimulate}
            disabled={isAnimating}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-4 text-lg font-semibold text-white transition-all hover:from-emerald-600 hover:to-green-600 disabled:opacity-50"
          >
            {isAnimating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Claiming... {progress}%
              </span>
            ) : (
              "Simulate Claim Winnings"
            )}
          </button>
        ) : (
          <Link
            href="/"
            className="block w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-4 text-center text-lg font-semibold text-white transition-all hover:from-emerald-600 hover:to-green-600"
          >
            {isConnected ? "Go to Your Positions" : "Connect Wallet First"}
          </Link>
        )}
      </div>
    </div>
  );
}

