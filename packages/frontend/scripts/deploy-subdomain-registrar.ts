import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
  encodeFunctionData,
  namehash,
  labelhash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const PRIVATE_KEY =
  '0xb02c9f8459885633b47bfff51afccfdd42b433213d592c0fcce3900f7e32a29e';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const NAME_WRAPPER_SEPOLIA = '0x0635513f179D50A207757E05759CbD106d7dFcE8';
const PUBLIC_RESOLVER_SEPOLIA = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';

const ensRegistryAbi = parseAbi([
  'function owner(bytes32 node) view returns (address)',
  'function resolver(bytes32 node) view returns (address)',
  'function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external',
  'function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external returns (bytes32)',
  'function setApprovalForAll(address operator, bool approved) external',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
]);

const nameWrapperAbi = parseAbi([
  'function setApprovalForAll(address operator, bool approved) external',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function setSubnodeRecord(bytes32 parentNode, string calldata label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry) external returns (bytes32)',
  'function ownerOf(uint256 id) view returns (address)',
  'function setFuses(bytes32 node, uint16 ownerControlledFuses) returns (uint32)',
  'function getData(uint256 id) view returns (address owner, uint32 fuses, uint64 expiry)',
]);

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  console.log('Account:', account.address);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });

  const predictEthNode = namehash('predict.eth');
  console.log('predict.eth namehash:', predictEthNode);

  const registryOwner = await publicClient.readContract({
    address: ENS_REGISTRY,
    abi: ensRegistryAbi,
    functionName: 'owner',
    args: [predictEthNode],
  });
  console.log('ENS Registry owner of predict.eth:', registryOwner);

  const registryResolver = await publicClient.readContract({
    address: ENS_REGISTRY,
    abi: ensRegistryAbi,
    functionName: 'resolver',
    args: [predictEthNode],
  });
  console.log('ENS Registry resolver of predict.eth:', registryResolver);

  const tokenId = BigInt(predictEthNode);
  let ownerOfPredictEth: `0x${string}`;
  try {
    ownerOfPredictEth = await publicClient.readContract({
      address: NAME_WRAPPER_SEPOLIA,
      abi: nameWrapperAbi,
      functionName: 'ownerOf',
      args: [tokenId],
    });
  } catch {
    ownerOfPredictEth = '0x0000000000000000000000000000000000000000';
  }
  console.log('NameWrapper owner of predict.eth:', ownerOfPredictEth);

  const isRegistryOwner =
    registryOwner.toLowerCase() === account.address.toLowerCase();
  const isWrapperOwner =
    ownerOfPredictEth.toLowerCase() === account.address.toLowerCase();

  console.log('\n--- Ownership Status ---');
  console.log('Is Registry owner:', isRegistryOwner);
  console.log('Is NameWrapper owner:', isWrapperOwner);

  if (!isRegistryOwner && !isWrapperOwner) {
    console.error('Error: You do not own predict.eth');
    console.log(
      'Registry owner:',
      registryOwner,
      '| Your address:',
      account.address
    );
    return;
  }

  if (isRegistryOwner && !isWrapperOwner) {
    console.log(
      '\nThe name is owned via Registry (not wrapped). Creating subdomains via Registry...'
    );

    console.log('\n--- Creating subdomain via ENS Registry ---');
    const testLabel = 'test-' + Date.now();
    const testLabelHash = labelhash(testLabel);
    console.log('Label:', testLabel);
    console.log('Label hash:', testLabelHash);

    try {
      const hash = await walletClient.writeContract({
        address: ENS_REGISTRY,
        abi: ensRegistryAbi,
        functionName: 'setSubnodeRecord',
        args: [
          predictEthNode,
          testLabelHash,
          account.address,
          PUBLIC_RESOLVER_SEPOLIA,
          BigInt(0),
        ],
      });
      console.log('Subdomain creation tx:', hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('Subdomain created! Block:', receipt.blockNumber);

      const subdomainNode = namehash(`${testLabel}.predict.eth`);
      console.log('Subdomain node:', subdomainNode);

      const subOwner = await publicClient.readContract({
        address: ENS_REGISTRY,
        abi: ensRegistryAbi,
        functionName: 'owner',
        args: [subdomainNode],
      });
      console.log('Subdomain owner:', subOwner);
    } catch (error) {
      console.error('Error creating subdomain:', error);
    }

    return;
  }

  console.log('You own predict.eth! Setting up subdomain permissions...');

  const data = await publicClient.readContract({
    address: NAME_WRAPPER_SEPOLIA,
    abi: nameWrapperAbi,
    functionName: 'getData',
    args: [tokenId],
  });
  console.log('predict.eth data:', {
    owner: data[0],
    fuses: data[1],
    expiry: data[2],
  });

  console.log('\n--- Test: Creating a subdomain "test.predict.eth" ---');

  try {
    const testLabel = 'test-' + Date.now();
    const hash = await walletClient.writeContract({
      address: NAME_WRAPPER_SEPOLIA,
      abi: nameWrapperAbi,
      functionName: 'setSubnodeRecord',
      args: [
        predictEthNode,
        testLabel,
        account.address,
        PUBLIC_RESOLVER_SEPOLIA,
        BigInt(0),
        0,
        BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60),
      ],
    });
    console.log('Subdomain creation tx:', hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Subdomain created! Block:', receipt.blockNumber);

    const subdomainNode = namehash(`${testLabel}.predict.eth`);
    console.log('Subdomain node:', subdomainNode);
  } catch (error) {
    console.error('Error creating subdomain:', error);
  }

  console.log('\n=== DEPLOYMENT INFO ===');
  console.log('predict.eth namehash:', predictEthNode);
  console.log('NameWrapper:', NAME_WRAPPER_SEPOLIA);
  console.log('Public Resolver:', PUBLIC_RESOLVER_SEPOLIA);
  console.log('Owner address:', account.address);
  console.log(
    '\nTo allow the app to create subdomains, update the frontend to call setSubnodeRecord'
  );
}

main().catch(console.error);
