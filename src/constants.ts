import { StarknetChainId } from 'starknet/constants';

export const STAGING_BASE_URL = 'https://goerli.api.avnu.fi';
export const BASE_URL = 'https://goerli.api.avnu.fi';
export const AVNU_ADDRESS: { [chainId: string]: string } = {
  [StarknetChainId.TESTNET]: '0x5c614428c49b94ab60c90ea55d366d328921c829bbd3ae81d748723750c0931',
};
