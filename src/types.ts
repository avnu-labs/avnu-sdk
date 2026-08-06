import { OutsideExecutionTypedData } from '@starknet-io/starknet-types-09';
import type { Duration } from 'moment';
import type { STRK20_ACTION, STRK20_CALL_AND_PROOF } from 'starknet';
import { AccountInterface, Call, ExecutionParameters, PaymasterInterface } from 'starknet';
import { DcaOrderStatus, DcaTradeStatus, FeedDateRange, FeedResolution, PriceFeedType, SourceType } from './enums';

export interface AvnuOptions {
  baseUrl?: string;
  impulseBaseUrl?: string;
  paymasterBaseUrl?: string;
  abortSignal?: AbortSignal;
  avnuPublicKey?: string;
}

/* Pagination Part */
export interface Pageable {
  page?: number;
  size?: number;
  sort?: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const getLastPageNumber = <T>(page: Page<T> | undefined): number =>
  page ? Math.ceil(page.totalElements / page.size) - 1 : 0;

/* Token Part */

export type TokenTag = 'Unknown' | 'Verified' | 'Community' | 'Unruggable' | 'AVNU';

export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUri: string | null;
  lastDailyVolumeUsd: number;
  extensions: { [key: string]: string };
  tags: TokenTag[];
}

export interface GetTokensRequest extends Pageable {
  search?: string;
  tags?: TokenTag[];
}

export interface MarketPrice {
  usd: number;
}

export interface TokenPrice {
  address: string;
  decimals: number;
  globalMarket: MarketPrice | null;
  starknetMarket: MarketPrice | null;
}

export type TokenPriceResponse = TokenPrice[];

/* Transactions Part */

export interface InvokeTransactionResponse {
  transactionHash: string;
}

export interface InvokeParams {
  provider: AccountInterface;
  paymaster?: InvokePaymasterParams;
}

/* Error Part */
export interface RequestError {
  messages: string[];
  revertError: string | undefined;
}

export class ContractError extends Error {
  public readonly revertError: string;
  constructor(message: string, revertError: string) {
    super(message);
    this.revertError = revertError;
  }
}

export class PaymasterRpcError extends Error {
  constructor(
    public readonly method: string,
    message: string,
    public readonly code: number,
    public readonly data?: unknown,
  ) {
    super(`Paymaster ${method}: ${message} (code: ${code})`);
    this.name = 'PaymasterRpcError';
  }
}

/* Paymaster Part */

export interface PaymasterParams {
  provider: PaymasterInterface;
  params: ExecutionParameters;
}

export interface InvokePaymasterParams extends PaymasterParams {
  active: boolean;
}

export interface BuildPaymasterTransactionParams {
  takerAddress: string;
  paymaster: PaymasterParams;
  calls: Call[];
}

export interface SignTransactionParams {
  provider: AccountInterface;
  typedData: OutsideExecutionTypedData;
}

export interface ExecutePaymasterTransactionParams {
  takerAddress: string;
  paymaster: PaymasterParams;
  signedTransaction: SignedPaymasterTransaction;
}

export interface SignedPaymasterTransaction {
  typedData: OutsideExecutionTypedData;
  signature: string[];
}

/* Swap Part */

export interface InvokeSwapParams extends InvokeParams {
  quote: Quote;
  slippage: number;
  executeApprove?: boolean;
}

export interface AvnuCalls {
  chainId: string;
  calls: Call[];
  executorAddress?: string;
}

/* Privacy (private swap) Part */

/**
 * Priority tip for the AVNU privacy paymaster. Defaults to 'normal' server-side.
 */
export type PrivacyTip = 'slow' | 'normal' | 'fast';

/**
 * Fee mode for a private swap. The paymaster sponsors the gas and reimburses
 * itself with a pool fee taken from the shielded balance in `poolFeeToken`.
 */
export interface PrivateFeeMode {
  poolFeeToken: string;
  tip?: PrivacyTip;
}

/**
 * A single call as expected by the privacy paymaster JSON-RPC endpoints.
 */
export interface PaymasterCall {
  to: string;
  selector: string;
  calldata: string[];
}

/**
 * The pool fee returned by the paymaster `apply_action` build step. It must be
 * withdrawn (inside the private transaction) to `recipient` so the paymaster is
 * reimbursed for the sponsored gas.
 */
export interface PrivateSwapFee {
  token: string;
  recipient: string;
  amount: bigint;
}

/**
 * The zero-knowledge proof materialized by the injected prover (a STRK20 wallet
 * or the Starknet privacy SDK). `data` and `proofFacts` are forwarded verbatim
 * to the paymaster.
 */
export interface PrivacyProof {
  data: string;
  proofFacts: string[];
}

/**
 * The prepared call and its proof. Both proving backends (wallet or privacy SDK)
 * converge to this artifact, which the paymaster submits on-chain.
 */
export interface PrivateSwapCallAndProof {
  call: Call;
  proof: PrivacyProof;
}

/**
 * A backend-neutral description of the private swap the prover must materialize:
 * withdraw `sellAmount` of the sell token to the executor, withdraw the pool fee
 * to its recipient, open a note for the buy token, then invoke the executor with
 * the swap calls.
 */
export interface PrivateSwapPlan {
  sellTokenAddress: string;
  sellAmount: bigint;
  buyTokenAddress: string;
  executorAddress: string;
  executorCalls: Call[];
  fee: PrivateSwapFee;
  takerAddress: string;
}

/**
 * The injected proof provider. Implement it with a STRK20-capable wallet
 * (`wallet_strk20PrepareInvoke`) or the Starknet privacy SDK. The SDK never
 * handles private keys, notes, or proof generation itself.
 */
export interface PrivateSwapProver {
  buildAndProve(plan: PrivateSwapPlan): Promise<PrivateSwapCallAndProof>;
}

/**
 * The STRK20 privacy wallet API surface needed to prove a private swap
 * (starknet.js `WalletAccountV6` / `wallet_strk20PrepareInvoke`).
 */
export interface Strk20ProverAccount {
  strk20PrepareInvoke(actions: STRK20_ACTION[], simulate?: boolean): Promise<STRK20_CALL_AND_PROOF>;
}

export interface BuildPrivateSwapFeeParams {
  poolAddress: string;
  feeMode: PrivateFeeMode;
  paymasterApiKey?: string;
}

export interface SubmitPrivateSwapParams {
  callAndProof: PrivateSwapCallAndProof;
  feeMode: PrivateFeeMode;
  paymasterApiKey?: string;
}

export interface ExecutePrivateSwapParams {
  quote: Quote;
  slippage: number;
  takerAddress: string;
  poolAddress: string;
  feeMode: PrivateFeeMode;
  prover: PrivateSwapProver;
  paymasterApiKey?: string;
  /**
   * The chain the caller operates on (e.g. from the wallet). When provided, it is
   * checked against `quote.chainId` before any network call so an obvious network
   * mismatch fails fast, before the expensive proof generation.
   */
  chainId?: string;
}

export interface QuoteRequest {
  sellTokenAddress: string;
  buyTokenAddress: string;
  sellAmount?: bigint;
  buyAmount?: bigint;
  takerAddress?: string;
  size?: number;
  excludeSources?: string[];
  integratorFees?: bigint;
  integratorFeeRecipient?: string;
  integratorName?: string;
  onlyDirect?: boolean;
}

export interface Route {
  name: string;
  address: string;
  percent: number;
  sellTokenAddress: string;
  buyTokenAddress: string;
  routeInfo?: Record<string, string>;
  routes: Route[];
  alternativeSwapCount: number;
}

export interface Fee {
  feeToken: string;
  avnuFees: bigint;
  avnuFeesInUsd: number;
  avnuFeesBps: bigint;
  integratorFees: bigint;
  integratorFeesInUsd: number;
  integratorFeesBps: bigint;
}
export interface Quote {
  quoteId: string;
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountInUsd: number;
  buyTokenAddress: string;
  buyAmount: bigint;
  buyAmountInUsd: number;
  fee: Fee;
  blockNumber?: number;
  chainId: string;
  expiry?: number | null;
  routes: Route[];
  gasFees: bigint; // In FRI
  gasFeesInUsd?: number;
  priceImpact: number;
  sellTokenPriceInUsd?: number | null;
  buyTokenPriceInUsd?: number | null;
  exactTokenTo?: boolean;
  estimatedSlippage?: number;
}

export interface QuoteToCallsParams {
  quoteId: string;
  slippage: number;
  takerAddress?: string;
  executeApprove?: boolean;
  /** Build a private swap. Mutually exclusive with takerAddress: the API sets the taker to its executor. */
  private?: boolean;
}

export interface Source {
  name: string;
  type: SourceType;
}

/* Staking Part */

export interface StakingActionToCallsParams {
  poolAddress: string;
  userAddress: string;
}

export interface StakeToCallsParams extends StakingActionToCallsParams {
  amount: bigint;
}

export interface UnstakeToCallsParams extends StakingActionToCallsParams {}

export interface ClaimRewardsToCallsParams extends StakingActionToCallsParams {
  restake: boolean;
}

export interface InvokeStakeParams extends InvokeParams {
  poolAddress: string;
  amount: bigint;
}

export interface InvokeInitiateUnstakeParams extends InvokeParams {
  poolAddress: string;
  amount: bigint;
}

export interface InvokeUnstakeParams extends InvokeParams {
  poolAddress: string;
}

export interface InvokeClaimRewardsParams extends InvokeParams {
  poolAddress: string;
  restake: boolean;
}

export interface StakingInfo {
  selfStakedAmount: bigint;
  selfStakedAmountInUsd: number | undefined;
  operationalAddress: string;
  rewardAddress: string;
  stakerAddress: string;
  commission: number;
  delegationPools: DelegationPool[];
}

export interface DelegationPool {
  poolAddress: string;
  tokenAddress: string;
  stakedAmount: bigint;
  stakedAmountInUsd: number | undefined;
  apr: number;
}

export interface UserStakingInfo {
  tokenAddress: string;
  tokenPriceInUsd: number;
  poolAddress: string;
  userAddress: string;
  amount: bigint;
  amountInUsd: number | undefined;
  unclaimedRewards: bigint;
  unclaimedRewardsInUsd: number | undefined;
  unpoolAmount: bigint;
  unpoolAmountInUsd: number | undefined;
  unpoolTime: Date | undefined;
  totalClaimedRewards: bigint;
  totalClaimedRewardsHistoricalUsd?: number;
  totalClaimedRewardsUsd: number;
  userActions: Action[];
  totalUserActionsCount: number;
  expectedYearlyStrkRewards: bigint;
  aprs: Apr[];
}

export interface Apr {
  date: Date;
  apr: number;
}

/* DCA Part */

export interface GetDcaOrdersParams extends Pageable {
  traderAddress: string;
  status?: DcaOrderStatus;
}

export interface PricingStrategy {
  tokenToMinAmount?: string;
  tokenToMaxAmount?: string;
}

export interface DcaTrade {
  sellAmount: bigint;
  sellAmountInUsd?: number;
  buyAmount?: bigint;
  buyAmountInUsd?: number;
  expectedTradeDate: Date;
  actualTradeDate?: Date;
  status: DcaTradeStatus;
  txHash?: string;
  errorReason?: string;
}

export interface DcaOrder {
  id: string;
  blockNumber: number;
  timestamp: Date;
  traderAddress: string;
  orderAddress: string;
  creationTransactionHash: string;
  orderClassHash: string;
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountPerCycle: bigint;
  buyTokenAddress: string;
  startDate: Date;
  endDate: Date;
  closeDate?: Date;
  frequency: string;
  iterations: number;
  status: DcaOrderStatus;
  pricingStrategy: PricingStrategy | Record<string, never>;
  amountSold: bigint;
  amountBought: bigint;
  averageAmountBought: bigint;
  executedTradesCount: number;
  cancelledTradesCount: number;
  pendingTradesCount: number;
  trades: DcaTrade[];
}

export interface CreateDcaOrder {
  sellTokenAddress: string | undefined;
  buyTokenAddress: string | undefined;
  sellAmount: string;
  sellAmountPerCycle: string;
  frequency: Duration;
  pricingStrategy: PricingStrategy | Record<string, never>;
  traderAddress: string;
}

export interface InvokeCreateDcaParams extends InvokeParams {
  order: CreateDcaOrder;
}

export interface InvokeCancelDcaParams extends InvokeParams {
  orderAddress: string;
}

/* User Actions Part */
export interface Action {
  blockNumber: bigint;
  date: Date;
  transactionHash: string;
  gasFee: GasFeeInfo | null;
  type: ActionType;
  metadata: ActionMetadata;
}

export type ActionType =
  | 'Swap'
  | 'OpenDcaOrder'
  | 'CancelDcaOrder'
  | 'DcaTrade'
  | 'StakingStake'
  | 'StakingInitiateWithdrawal'
  | 'StakingCancelWithdrawal'
  | 'StakingWithdraw'
  | 'StakingClaimRewards';

export interface GasFeeInfo {
  gasFeeAmount?: bigint;
  gasFeeAmountUsd?: number;
  gasFeeTokenAddress?: string;
}

export type ActionMetadata =
  | SwapMetadata
  | DcaOrderMetadata
  | CancelDcaOrderMetadata
  | DcaTradeMetadata
  | StakingInitiateUnstakeMetadata
  | StakingCancelUnstakeMetadata
  | StakingStakeMetadata
  | StakingClaimRewardsMetadata
  | StakingUnstakeMetadata;

export interface SwapMetadata {
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountUsd?: number;
  buyTokenAddress: string;
  buyAmount: bigint;
  buyAmountUsd?: number;
  integratorName?: string;
}

export interface DcaOrderMetadata {
  orderClassHash: string;
  orderAddress: string;
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountUsd?: number;
  sellAmountPerCycle: bigint;
  buyTokenAddress: string;
  cycleFrequency: bigint;
  startDate: Date;
  endDate: Date;
}

export interface CancelDcaOrderMetadata {
  orderAddress: string;
}

export interface DcaTradeMetadata {
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountUsd?: number;
  buyTokenAddress: string;
  buyAmount: bigint;
  buyAmountUsd?: number;
}

export interface StakingInitiateUnstakeMetadata {
  delegationPoolAddress: string;
  exitTimestamp: Date;
  amount: bigint;
  amountUsd?: number;
  oldDelegatedStake: bigint;
  oldDelegatedStakeUsd?: number;
  newDelegatedStake: bigint;
  newDelegatedStakeUsd?: number;
}

export interface StakingCancelUnstakeMetadata {
  delegationPoolAddress: string;
  oldDelegatedStake: bigint;
  oldDelegatedStakeUsd?: number;
  newDelegatedStake: bigint;
  newDelegatedStakeUsd?: number;
}

export interface StakingStakeMetadata {
  delegationPoolAddress: string;
  oldDelegatedStake: bigint;
  oldDelegatedStakeUsd?: number;
  newDelegatedStake: bigint;
  newDelegatedStakeUsd?: number;
}

export interface StakingClaimRewardsMetadata {
  delegationPoolAddress: string;
  rewardAddress: string;
  amount: bigint;
  amountUsd?: number;
}

export interface StakingUnstakeMetadata {
  delegationPoolAddress: string;
  amount: bigint;
  amountUsd?: number;
}

/* Impulse Market Part */

export interface SimpleDateProps {
  date?: string | Date;
}

export interface SimpleFeedProps {
  dateRange: FeedDateRange;
}

export interface FeedProps extends SimpleFeedProps {
  resolution: FeedResolution;
}

export interface PriceFeedProps extends FeedProps {
  type: PriceFeedType;
}

export interface StarknetMarket {
  usd: number;
  usdTvl: number;
  usdPriceChange1h: number;
  usdPriceChangePercentage1h: number | null;
  usdPriceChange24h: number;
  usdPriceChangePercentage24h: number | null;
  usdPriceChange7d: number;
  usdPriceChangePercentage7d: number | null;
  usdVolume24h: number;
  usdTradingVolume24h: number;
}

export interface GlobalMarket {
  usd: number;
  usdMarketCap: number;
  usdFdv: number;
  usdMarketCapChange24h: number;
  usdMarketCapChangePercentage24h: number;
}

export interface DataPoint {
  date: string;
  value: number;
}

export interface DataPointWithUsd {
  date: string;
  value: number;
  valueUsd: number;
}

export interface ExchangeDataPoint extends DataPointWithUsd {
  exchange: string;
}

export interface ExchangeRangeDataPoint {
  value: number;
  valueUsd: number;
  exchange: string;
  startDate: string;
  endDate: string;
}

export interface CandleDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TokenMarketData {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  logoUri?: string | null;
  coingeckoId?: string | null;
  verified: boolean;
  starknet: StarknetMarket;
  global: GlobalMarket | null;
  tags: TokenTag[];
  linePriceFeedInUsd: DataPoint[];
}
