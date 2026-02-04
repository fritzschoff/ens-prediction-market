import { createPublicClient, http, decodeErrorResult } from 'viem';
import { sepolia } from 'viem/chains';
import { MARKET_FACTORY_ABI, CONTRACTS } from '../src/lib/contracts';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

async function debugCreateMarket() {
  const params = {
    question: 'Will I win the ETHGlobal HackMoney Hackathon?',
    oracle: '0xA8DF87507994618e1CefE3E4bBCaf9fB612127CC' as `0x${string}`,
    expiry: BigInt(1772811420),
    ensName: 'ethglobal-hackmoney-hackathon-11.predict.eth',
  };

  console.log('Testing createMarket simulation with params:');
  console.log(JSON.stringify(params, null, 2));
  console.log('\nContract address:', CONTRACTS.MARKET_FACTORY);
  console.log('Current block timestamp:', (await publicClient.getBlock()).timestamp);

  try {
    const result = await publicClient.simulateContract({
      address: CONTRACTS.MARKET_FACTORY,
      abi: MARKET_FACTORY_ABI,
      functionName: 'createMarket',
      args: [params],
      account: params.oracle,
    });

    console.log('\n✅ Simulation successful!');
    console.log('Gas estimate:', result.request.gas?.toString());
  } catch (error: any) {
    console.error('\n❌ Simulation failed!');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);

    const cause = error.cause || error;
    console.error('\nCause:', cause);

    if (cause?.data) {
      console.error('\nError data:', cause.data);
      
      try {
        const decoded = decodeErrorResult({
          abi: MARKET_FACTORY_ABI,
          data: cause.data as `0x${string}`,
        });
        console.error('\n✅ Decoded error:', decoded);
        console.error('Error name:', decoded.errorName);
        console.error('Error args:', decoded.args);
      } catch (decodeError) {
        console.error('\n❌ Failed to decode error:', decodeError);
        if (typeof cause.data === 'string' && cause.data.startsWith('0x')) {
          const selector = cause.data.slice(0, 10);
          console.error('Error selector:', selector);
          console.error('\nKnown error selectors:');
          console.error('  InvalidOracle: 0x9589a27d');
          console.error('  InvalidExpiry: 0x72b13ad8');
          console.error('  EmptyQuestion: 0x6d705ebb');
          console.error('  ENSNameTaken: 0x8c5be1e5');
        }
      }
    }

    if (cause?.error?.data) {
      console.error('\nNested error data:', cause.error.data);
    }

    if (cause?.shortMessage) {
      console.error('\nShort message:', cause.shortMessage);
    }

    if (cause?.reason) {
      console.error('\nReason:', cause.reason);
    }

    console.error('\nFull error object:', JSON.stringify(error, null, 2));
  }
}

debugCreateMarket()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

