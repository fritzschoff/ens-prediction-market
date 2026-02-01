'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useCreateMarket, useRegisterENS, useClaimSubdomain } from '@/hooks';
import { CONTRACTS } from '@/lib/contracts';

export default function CreateMarketPage() {
  const { address, isConnected } = useAccount();
  const [question, setQuestion] = useState(
    'Will I win the ETHGlobal HackMoney Hackathon?'
  );
  const [ensName, setEnsName] = useState('ethglobal-hackmoney-hackathon');
  const [expiryDate, setExpiryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 16);
  });
  const [criteria, setCriteria] = useState(
    'Will resolve YES if I win the ETHGlobal HackMoney Hackathon'
  );

  const {
    createMarket,
    simulateCreateMarket,
    clearError,
    isLoading: isCreatingMarket,
    isSimulating,
    isSuccess: isMarketCreated,
    error,
    simulationError,
    marketId,
    marketResult,
  } = useCreateMarket();

  const {
    registerENS,
    isLoading: isRegisteringENS,
    isSuccess: isENSRegistered,
    error: ensError,
    clearError: clearENSError,
  } = useRegisterENS();

  const {
    claimSubdomain,
    checkSubdomainAvailability,
    isLoading: isClaimingSubdomain,
    error: claimError,
    clearError: clearClaimError,
  } = useClaimSubdomain();

  const [step, setStep] = useState<
    | 'idle'
    | 'checking'
    | 'simulating'
    | 'creating'
    | 'claiming'
    | 'registering'
    | 'success'
  >('idle');
  const [ensBaseParams, setEnsBaseParams] = useState<{
    ensName: string;
    pool: `0x${string}`;
    oracle: `0x${string}`;
    expiry: number;
    criteria: string;
  } | null>(null);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);

  useEffect(() => {
    if (
      isMarketCreated &&
      marketResult &&
      ensBaseParams &&
      step === 'creating'
    ) {
      setStep('claiming');
      const label = ensBaseParams.ensName.replace('.predict.eth', '');

      claimSubdomain({
        label,
        newOwner: address!,
      }).then((result) => {
        if (result.success) {
          setStep('registering');
          registerENS({
            ...ensBaseParams,
            yesToken: marketResult.yesToken,
            noToken: marketResult.noToken,
            creator: marketResult.creator,
          });
        } else {
          setSubdomainError(result.error || 'Failed to claim subdomain');
        }
      });
    }
  }, [
    isMarketCreated,
    marketResult,
    ensBaseParams,
    step,
    address,
    claimSubdomain,
    registerENS,
  ]);

  useEffect(() => {
    if (isENSRegistered && step === 'registering') {
      setStep('success');
    }
  }, [isENSRegistered, step]);

  const isLoading = isCreatingMarket || isClaimingSubdomain || isRegisteringENS;
  const isSuccess = step === 'success';
  const allSimulating = isSimulating || step === 'checking';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !question || !criteria || !ensName) return;

    clearError();
    clearENSError();
    clearClaimError();
    setSubdomainError(null);
    setStep('checking');

    const label = ensName.replace('.predict.eth', '');
    const fullEnsName = `${label}.predict.eth`;
    const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);

    try {
      const isAvailable = await checkSubdomainAvailability(label);
      console.log('Subdomain available:', isAvailable);

      if (!isAvailable) {
        setSubdomainError(`Subdomain "${fullEnsName}" is already taken`);
        setStep('idle');
        return;
      }

      setStep('simulating');

      const marketParams = {
        question,
        oracle: address,
        expiry: expiryTimestamp,
      };

      const marketSimulation = await simulateCreateMarket(marketParams);
      console.log('Market simulation', marketSimulation);

      if (marketSimulation.success) {
        setEnsBaseParams({
          ensName: fullEnsName,
          pool: CONTRACTS.PREDICTION_HOOK,
          oracle: address,
          expiry: expiryTimestamp,
          criteria,
        });
        setStep('creating');
        await createMarket(marketParams, marketSimulation.gas);
      } else {
        setStep('idle');
      }
    } catch (err) {
      console.error('Failed to create market:', err);
      setStep('idle');
    }
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
              This name will be used to identify your market on ENS (requires
              owning predict.eth domain)
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Expiry Date & Time
            </label>
            <input
              type="datetime-local"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="mt-3 flex gap-2">
              {[
                { days: 7, label: '7 days' },
                { days: 30, label: '30 days' },
                { days: 90, label: '90 days' },
                { days: 365, label: '1 year' },
              ].map(({ days, label }) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    const date = new Date();
                    date.setDate(date.getDate() + days);
                    setExpiryDate(date.toISOString().slice(0, 16));
                  }}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-indigo-500/50 hover:text-indigo-400"
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Market will expire at this date and time
            </p>
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
                <span className="text-slate-500">Collateral</span>
                <span className="text-slate-300">ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Creation Fee</span>
                <span className="text-slate-300">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ENS Registration</span>
                <span className="text-slate-300">Optional (gas only)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Network</span>
                <span className="text-slate-300">Sepolia Testnet</span>
              </div>
            </div>
          </div>

          {(error ||
            simulationError ||
            ensError ||
            claimError ||
            subdomainError) && (
            <div className="break-words rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
              {subdomainError ? (
                <>
                  <div className="mb-2 font-semibold">
                    Subdomain Unavailable:
                  </div>
                  <div>{subdomainError}</div>
                </>
              ) : claimError ? (
                <>
                  <div className="mb-2 font-semibold">
                    Subdomain Claim Failed:
                  </div>
                  <div>
                    {claimError instanceof Error
                      ? claimError.message
                      : 'Failed to claim subdomain'}
                  </div>
                </>
              ) : simulationError ? (
                <>
                  <div className="mb-2 font-semibold">Simulation Failed:</div>
                  <div>
                    {simulationError instanceof Error
                      ? simulationError.message
                      : 'Simulation failed'}
                  </div>
                </>
              ) : ensError ? (
                <>
                  <div className="mb-2 font-semibold">
                    ENS Registration Failed:
                  </div>
                  <div>
                    {ensError instanceof Error
                      ? ensError.message
                      : 'Failed to register ENS'}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2 font-semibold">Error:</div>
                  <div>
                    {error instanceof Error
                      ? error.message
                      : 'Failed to create market'}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'claiming' && (
            <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm text-yellow-400">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Market created! Claiming subdomain...
              </div>
            </div>
          )}

          {step === 'registering' && (
            <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm text-yellow-400">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Subdomain claimed! Registering ENS records...
              </div>
            </div>
          )}

          {isSuccess && marketId && (
            <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-400">
              <div className="font-semibold mb-2">
                Market created & ENS registered!
              </div>
              <div className="space-y-1">
                <div>Market ID: {marketId.slice(0, 10)}...</div>
                <div>
                  ENS:{' '}
                  {ensName.endsWith('.predict.eth')
                    ? ensName
                    : `${ensName}.predict.eth`}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={
              !isConnected ||
              !question ||
              !ensName ||
              !criteria ||
              isLoading ||
              allSimulating ||
              isSuccess
            }
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 text-lg font-semibold text-white transition-all hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 'checking'
              ? 'Checking subdomain availability...'
              : step === 'simulating' || isSimulating
              ? 'Simulating market...'
              : step === 'creating' || isCreatingMarket
              ? 'Creating Market...'
              : step === 'claiming' || isClaimingSubdomain
              ? 'Claiming Subdomain...'
              : step === 'registering' || isRegisteringENS
              ? 'Registering ENS...'
              : !isConnected
              ? 'Connect Wallet'
              : simulationError || subdomainError
              ? 'Retry'
              : isSuccess
              ? 'Market Created!'
              : 'Create Market & Register ENS'}
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
