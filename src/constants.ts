import { constants } from 'starknet';

export const STAGING_BASE_URL = 'https://goerli.api.avnu.fi';
export const BASE_URL = 'https://goerli.api.avnu.fi';
export const AVNU_ADDRESS: { [chainId: string]: string } = {
  [constants.StarknetChainId.TESTNET]: '0x5c614428c49b94ab60c90ea55d366d328921c829bbd3ae81d748723750c0931',
  [`${constants.StarknetChainId.TESTNET}-dev`]: '0x7852cb149218526b12a1ca5a2c443976571c8d9881b343cbf617575a34eec08',
};
