import { toBeHex } from 'ethers';
import { Call } from 'starknet';
import { STAKING_API_VERSION } from './constants';
import { executeAllPaymasterFlow } from './paymaster.services';
import { StakingInfoSchema, UserStakingInfoSchema } from './schemas';
import {
  AvnuCalls,
  AvnuOptions,
  ClaimRewardsToCallsParams,
  InvokeClaimRewardsParams,
  InvokeInitiateUnstakeParams,
  InvokeStakeParams,
  InvokeTransactionResponse,
  InvokeUnstakeParams,
  StakeToCallsParams,
  StakingInfo,
  UnstakeToCallsParams,
  UserStakingInfo,
} from './types';
import { getBaseUrl, getRequest, parseResponse, parseResponseWithSchema, postRequest } from './utils';

/**
 * Get the AVNU staking info, including the self staked amount and the operational address
 * @param options Optional SDK configuration
 * @returns The AVNU staking info
 */
const getAvnuStakingInfo = async (options?: AvnuOptions): Promise<StakingInfo> => {
  return fetch(`${getBaseUrl(options)}/staking/${STAKING_API_VERSION}`, getRequest(options)).then((response) =>
    parseResponseWithSchema(response, StakingInfoSchema, options?.avnuPublicKey),
  );
};

/**
 * Get the user staking info for a given staking pool
 * @param tokenAddress The staked token address
 * @param userAddress The user address
 * @param options Optional SDK configuration
 * @returns The user staking info
 */
const getUserStakingInfo = async (
  tokenAddress: string,
  userAddress: string,
  options?: AvnuOptions,
): Promise<UserStakingInfo> => {
  return fetch(
    `${getBaseUrl(options)}/staking/${STAKING_API_VERSION}/pools/${tokenAddress}/members/${userAddress}`,
    getRequest(options),
  ).then((response) => parseResponseWithSchema(response, UserStakingInfoSchema, options?.avnuPublicKey));
};

/**
 * Build the calls to execute a staking action
 * @param endpoint The endpoint to execute
 * @param poolAddress The staking pool address
 * @param userAddress The user address
 * @param body The body of the request
 * @param options Optional SDK configuration
 * @returns The calls to execute
 */
const actionToCalls = async (
  endpoint: string,
  poolAddress: string,
  userAddress: string,
  body: unknown,
  options?: AvnuOptions,
): Promise<AvnuCalls> => {
  return fetch(
    `${getBaseUrl(options)}/staking/${STAKING_API_VERSION}/pools/${poolAddress}/members/${userAddress}/${endpoint}`,
    postRequest(body, options),
  ).then((response) => parseResponse<AvnuCalls>(response, options?.avnuPublicKey));
};

/**
 * Build the calls to execute a "stake" action
 * @param params.poolAddress The staking pool address
 * @param params.userAddress The user address
 * @param params.amount The amount to stake
 * @param options Optional SDK configuration
 * @returns The calls to execute
 */
const stakeToCalls = async (params: StakeToCallsParams, options?: AvnuOptions): Promise<AvnuCalls> => {
  const { poolAddress, userAddress, amount } = params;
  const body = { userAddress, amount: toBeHex(amount) };
  return actionToCalls('stake', poolAddress, userAddress, body, options);
};

/**
 * Build the calls to execute a "initiate withdrawal" action
 * @param params.poolAddress The staking pool address
 * @param params.userAddress The user address
 * @param params.amount The amount to initiate withdrawal
 * @param options Optional SDK configuration
 * @returns The calls to execute
 */
const initiateUnstakeToCalls = async (params: StakeToCallsParams, options?: AvnuOptions): Promise<AvnuCalls> => {
  const { poolAddress, userAddress, amount } = params;
  const body = { userAddress, amount: toBeHex(amount) };
  return actionToCalls('initiate-withdraw', poolAddress, userAddress, body, options);
};

/**
 * Build the calls to execute a "claim withdrawal" action after the withdrawal period has ended
 * @param params.poolAddress The staking pool address
 * @param params.userAddress The user address
 * @param options Optional SDK configuration
 * @returns The calls to execute
 */
const unstakeToCalls = async (params: UnstakeToCallsParams, options?: AvnuOptions): Promise<AvnuCalls> => {
  const { poolAddress, userAddress } = params;
  const body = { userAddress };
  return actionToCalls('claim-withdraw', poolAddress, userAddress, body, options);
};

/**
 * Build the calls to execute a "claim rewards" action
 * @param params.poolAddress The staking pool address
 * @param params.userAddress The user address
 * @param params.restake Whether to restake the rewards or not(only for STRK rewards)
 * @param options Optional SDK configuration
 * @returns The calls to execute
 */
const claimRewardsToCalls = async (params: ClaimRewardsToCallsParams, options?: AvnuOptions): Promise<AvnuCalls> => {
  const { poolAddress, userAddress, restake } = params;
  const body = { userAddress, restake };
  return actionToCalls('claim-rewards', poolAddress, userAddress, body, options);
};

/**
 * Execute a "stake" action
 * @param params.provider The provider to execute the action
 * @param params.paymaster The paymaster to execute the action, if needed
 * @param params.paymaster.active True if the tx must be executed through a paymaster
 * @param params.paymaster.provider The paymaster provider, must implement the PaymasterInterface
 * @param params.paymaster.params The paymaster tx parameters
 * @param params.poolAddress The staking pool address
 * @param params.amount The amount to stake
 * @param options Optional SDK configuration
 * @returns The transaction hash
 */
const executeStake = async (params: InvokeStakeParams, options?: AvnuOptions): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, poolAddress, amount } = params;
  const { calls } = await stakeToCalls({ poolAddress, userAddress: provider.address, amount }, options);
  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }
  return provider.execute(calls).then((result) => ({ transactionHash: result.transaction_hash }));
};

/**
 * Execute a "initiate withdrawal" action
 * @param params.provider The provider to execute the action
 * @param params.paymaster The paymaster to execute the action, if needed
 * @param params.paymaster.active True if the tx must be executed through a paymaster
 * @param params.paymaster.provider The paymaster provider, must implement the PaymasterInterface
 * @param params.paymaster.params The paymaster tx parameters
 * @param params.poolAddress The staking pool address
 * @param params.amount The amount to initiate withdrawal
 * @param options Optional SDK configuration
 * @returns The transaction hash
 */
const executeInitiateUnstake = async (
  params: InvokeInitiateUnstakeParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, poolAddress, amount } = params;
  const { calls } = await initiateUnstakeToCalls({ poolAddress, userAddress: provider.address, amount }, options);
  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }
  return provider.execute(calls).then((result) => ({ transactionHash: result.transaction_hash }));
};

/**
 * Execute a "claim withdrawal" action after the withdrawal period has ended
 * @param params.provider The provider to execute the action
 * @param params.paymaster The paymaster to execute the action, if needed
 * @param params.paymaster.active True if the tx must be executed through a paymaster
 * @param params.paymaster.provider The paymaster provider, must implement the PaymasterInterface
 * @param params.paymaster.params The paymaster tx parameters
 * @param params.poolAddress The staking pool address
 * @param options Optional SDK configuration
 * @returns The transaction hash
 */
const executeUnstake = async (
  params: InvokeUnstakeParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, poolAddress } = params;
  const { calls } = await unstakeToCalls({ poolAddress, userAddress: provider.address }, options);
  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }
  return provider.execute(calls).then((result) => ({ transactionHash: result.transaction_hash }));
};

/**
 * Execute a "claim rewards" action
 * @param params.provider The provider to execute the action
 * @param params.paymaster The paymaster to execute the action, if needed
 * @param params.paymaster.active True if the tx must be executed through a paymaster
 * @param params.paymaster.provider The paymaster provider, must implement the PaymasterInterface
 * @param params.paymaster.params The paymaster tx parameters
 * @param params.poolAddress The staking pool address
 * @param params.restake Whether to restake the rewards or not(only for STRK rewards)
 * @param options Optional SDK configuration
 * @returns The transaction hash
 */
const executeClaimRewards = async (
  params: InvokeClaimRewardsParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, poolAddress, restake } = params;
  const { calls } = await claimRewardsToCalls({ poolAddress, userAddress: provider.address, restake }, options);
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
  getAvnuStakingInfo,
  getUserStakingInfo,
  initiateUnstakeToCalls,
  stakeToCalls,
  unstakeToCalls,
};
