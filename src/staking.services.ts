import { toBeHex } from 'ethers';
import { Call } from 'starknet';
import { executeAllPaymasterFlow } from './paymaster.services';
import {
  AvnuOptions,
  ClaimRewardsToCallsParams,
  InvokeClaimRewardsParams,
  InvokeInitiateUnstakeParams,
  InvokeStakeParams,
  InvokeTransactionResponse,
  InvokeUnstakeParams,
  PoolMemberInfo,
  StakeToCallsParams,
  StakingInfo,
  UnstakeToCallsParams,
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

const actionToCalls = async (
  endpoint: string,
  poolAddress: string,
  userAddress: string,
  body: unknown,
  options?: AvnuOptions,
): Promise<Call[]> => {
  return fetch(
    `${getBaseUrl(options)}/staking/v2/pools/${poolAddress}/members/${userAddress}/${endpoint}`,
    postRequest(body, options),
  ).then((response) => parseResponse<Call[]>(response, options?.avnuPublicKey));
};

const stakeToCalls = async (params: StakeToCallsParams, options?: AvnuOptions): Promise<Call[]> => {
  const { poolAddress, userAddress, amount } = params;
  const body = { userAddress, amount: toBeHex(amount) };
  return actionToCalls('stake', poolAddress, userAddress, body, options);
};

const initiateUnstakeToCalls = async (params: StakeToCallsParams, options?: AvnuOptions): Promise<Call[]> => {
  const { poolAddress, userAddress, amount } = params;
  const body = { userAddress, amount: toBeHex(amount) };
  return actionToCalls('initiate-withdraw', poolAddress, userAddress, body, options);
};

const unstakeToCalls = async (params: UnstakeToCallsParams, options?: AvnuOptions): Promise<Call[]> => {
  const { poolAddress, userAddress } = params;
  const body = { userAddress };
  return actionToCalls('claim-withdraw', poolAddress, userAddress, body, options);
};

const claimRewardsToCalls = async (params: ClaimRewardsToCallsParams, options?: AvnuOptions): Promise<Call[]> => {
  const { poolAddress, userAddress, restake } = params;
  const body = { userAddress, restake };
  return actionToCalls('claim-rewards', poolAddress, userAddress, body, options);
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
  params: InvokeInitiateUnstakeParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, poolAddress, amount } = params;
  const calls = await initiateUnstakeToCalls({ poolAddress, userAddress: provider.address, amount }, options);
  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }
  return provider.execute(calls).then((result) => ({ transactionHash: result.transaction_hash }));
};

const executeUnstake = async (
  params: InvokeUnstakeParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, poolAddress } = params;
  const calls = await unstakeToCalls({ poolAddress, userAddress: provider.address }, options);
  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }
  return provider.execute(calls).then((result) => ({ transactionHash: result.transaction_hash }));
};

const executeClaimRewards = async (
  params: InvokeClaimRewardsParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, poolAddress, restake } = params;
  const calls = await claimRewardsToCalls({ poolAddress, userAddress: provider.address, restake }, options);
  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }
  return provider.execute(calls).then((result) => ({ transactionHash: result.transaction_hash }));
};

export {
  claimRewardsToCalls,
  executeClaimRewards,
  executeInitiateUnstake,
  executeStake,
  executeUnstake,
  getPoolMemberInfo,
  getStakingInfo,
  initiateUnstakeToCalls,
  stakeToCalls,
  unstakeToCalls,
};
