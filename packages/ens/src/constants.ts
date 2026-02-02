export const ENS_REGISTRY_ADDRESS =
  '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const;

export const ENS_PUBLIC_RESOLVER_SEPOLIA =
  '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD' as const;

export const PREDICT_ETH_PARENT = 'predict.eth' as const;

export const PREDICT_ETH_OWNER =
  '0xA8DF87507994618e1CefE3E4bBCaf9fB612127CC' as const;

export const MARKET_RECORD_KEYS = {
  pool: 'pool',
  oracle: 'oracle',
  expiry: 'expiry',
  criteria: 'criteria',
  yesToken: 'yesToken',
  noToken: 'noToken',
  creator: 'creator',
} as const;

export const SUPPORTED_CHAINS = {
  mainnet: 1,
  sepolia: 11155111,
} as const;
