"use client";

import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import {
  createYellowClient,
  createSessionManager,
  YellowClient,
  SessionManager,
  Session,
  BetCommitment,
} from "@hack-money/yellow";
import { parseEther } from "viem";

const YELLOW_CONFIG = {
  rpcUrl: "https://nitrolite.yellow.org",
  chainId: 11155111,
};

export function useYellowSession() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<YellowClient | null>(null);
  const [sessionManager] = useState<SessionManager>(() => createSessionManager());
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [commitments, setCommitments] = useState<BetCommitment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const initializeClient = useCallback(() => {
    if (!publicClient) return null;

    const yellowClient = createYellowClient(YELLOW_CONFIG, publicClient);

    if (walletClient) {
      yellowClient.setWalletClient(walletClient);
    }

    setClient(yellowClient);
    return yellowClient;
  }, [publicClient, walletClient]);

  const createSession = useCallback(
    async (allowanceAmount: string, expiryHours: number = 24) => {
      if (!address || !client) return null;

      setIsLoading(true);

      try {
        const session = await client.createSession({
          userAddress: address,
          appAddress: address,
          allowance: parseEther(allowanceAmount),
          expiry: Date.now() + expiryHours * 60 * 60 * 1000,
        });

        sessionManager.addSession(session);
        setCurrentSession(session);

        return session;
      } finally {
        setIsLoading(false);
      }
    },
    [address, client, sessionManager]
  );

  const placeBet = useCallback(
    async (marketId: string, outcome: boolean, amount: bigint) => {
      if (!client || !currentSession) {
        throw new Error("No active session");
      }

      if (!sessionManager.canCommit(currentSession.id, amount)) {
        throw new Error("Insufficient session allowance");
      }

      const commitment = await client.commitBet(
        currentSession,
        marketId,
        outcome,
        amount
      );

      sessionManager.addCommitment(commitment);
      setCommitments((prev) => [...prev, commitment]);

      return commitment;
    },
    [client, currentSession, sessionManager]
  );

  const settleBets = useCallback(async () => {
    if (!client || !currentSession) {
      throw new Error("No active session");
    }

    const pendingCommitments = sessionManager.getPendingCommitments(
      currentSession.id
    );

    if (pendingCommitments.length === 0) {
      throw new Error("No pending bets to settle");
    }

    const result = await client.settleBets({
      sessionId: currentSession.id,
      commitments: pendingCommitments,
    });

    return result;
  }, [client, currentSession, sessionManager]);

  const closeSession = useCallback(async () => {
    if (!client || !currentSession) return;

    await client.closeSession(currentSession.id);
    sessionManager.updateSessionStatus(currentSession.id, "closed");
    setCurrentSession(null);
    setCommitments([]);
  }, [client, currentSession, sessionManager]);

  const remainingAllowance = currentSession
    ? sessionManager.getRemainingAllowance(currentSession.id)
    : 0n;

  return {
    client,
    currentSession,
    commitments,
    isLoading,
    remainingAllowance,
    initializeClient,
    createSession,
    placeBet,
    settleBets,
    closeSession,
  };
}

