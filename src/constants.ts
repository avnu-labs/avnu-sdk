import { constants } from 'starknet';

export const STAGING_BASE_URL = 'https://goerli.api.avnu.fi';
export const BASE_URL = 'https://goerli.api.avnu.fi';
export const AVNU_ADDRESS: { [chainId: string]: string } = {
  [constants.StarknetChainId.TESTNET]: '0x6d8cd321dcbbf54512eab67c8a6849faf920077a3996f40bb4761adc4f021d2',
  [`${constants.StarknetChainId.TESTNET}-dev`]: '0x871a5d57d3d89a451edfccb4a925bfbb712f960c69396d19ca12b3916fb1cd',
};
