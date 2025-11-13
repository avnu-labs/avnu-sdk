import { toBeHex } from 'ethers';
import { Call } from 'starknet';
import { executeAllPaymasterFlow } from './paymaster.services';
import {
  AvnuOptions,
  InvokeStakeParams,
  InvokeTransactionResponse,
  PoolMemberInfo,
  StakeToCallsParams,
  StakingInfo,
} from './types';
import { getBaseUrl, getRequest, parseResponse, postRequest } from './utils';

const getStakingInfo = async (options?: AvnuOptions): Promise<StakingInfo> => {
  return fetch(`${getBaseUrl(options)}/staking/v2/info`, getRequest(options)).then((response) =>
    parseResponse<StakingInfo>(response, options?.avnuPublicKey),
  );
};

const getPoolMemberInfo = async (
  tokenAddress: string,
  userAddress: string,
  options?: AvnuOptions,
): Promise<PoolMemberInfo> => {
  return fetch(
    `${getBaseUrl(options)}/staking/v2/pools/${tokenAddress}/members/${userAddress}`,
    getRequest(options),
  ).then((response) => parseResponse<PoolMemberInfo>(response, options?.avnuPublicKey));
};

const stakeOrUnstakeToCalls = async (
  endpoint: string,
  params: StakeToCallsParams,
  options?: AvnuOptions,
): Promise<Call[]> => {
  const { poolAddress, userAddress, amount } = params;
  return fetch(
    `${getBaseUrl(options)}/staking/v2/pools/${poolAddress}/members/${userAddress}/${endpoint}`,
    postRequest({ userAddress, amount: toBeHex(amount) }, options),
  ).then((response) => parseResponse<Call[]>(response, options?.avnuPublicKey));
};

const initiateUnstakeToCalls = async (params: StakeToCallsParams, options?: AvnuOptions): Promise<Call[]> => {
  return stakeOrUnstakeToCalls('initiate-withdraw', params, options);
};

const stakeToCalls = async (params: StakeToCallsParams, options?: AvnuOptions): Promise<Call[]> => {
  return stakeOrUnstakeToCalls('stake', params, options);
};

const executeStake = async (params: InvokeStakeParams, options?: AvnuOptions): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, poolAddress, amount } = params;
  const calls = await stakeToCalls({ poolAddress, userAddress: provider.address, amount }, options);
  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }
  return provider.execute(calls).then((result) => ({ transactionHash: result.transaction_hash }));
};

const executeInitiateUnstake = async (
  params: InvokeStakeParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, poolAddress, amount } = params;
  const calls = await initiateUnstakeToCalls({ poolAddress, userAddress: provider.address, amount }, options);
  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }
  return provider.execute(calls).then((result) => ({ transactionHash: result.transaction_hash }));
};

export {
  executeInitiateUnstake,
  executeStake,
  getPoolMemberInfo,
  getStakingInfo,
  initiateUnstakeToCalls,
  stakeToCalls,
};
