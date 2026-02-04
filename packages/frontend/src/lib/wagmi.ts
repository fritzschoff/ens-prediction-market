import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http, fallback } from 'wagmi';

const sepoliaTransports = fallback([
  http('https://ethereum-sepolia-rpc.publicnode.com', {
    retryCount: 1,
    retryDelay: 500,
  }),
]);

export const config = getDefaultConfig({
  appName: 'ENS Prediction Markets',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [sepolia],
  ssr: false,
  transports: {
    [sepolia.id]: sepoliaTransports,
  },
});
