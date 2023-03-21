import { constants } from 'starknet';

export const STAGING_BASE_URL = 'https://goerli.api.avnu.fi';
export const BASE_URL = 'https://goerli.api.avnu.fi';
export const AVNU_ADDRESS: { [chainId: string]: string } = {
  [constants.StarknetChainId.TESTNET]: '0x06d8cd321dcbbf54512eab67c8a6849faf920077a3996f40bb4761adc4f021d2',
  [`${constants.StarknetChainId.TESTNET}-dev`]: '0x7852cb149218526b12a1ca5a2c443976571c8d9881b343cbf617575a34eec08',
};
