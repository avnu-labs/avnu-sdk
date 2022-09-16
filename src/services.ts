import { BigNumberish } from 'ethers';
import qs from 'qs';
import { AccountInterface, Call, InvokeFunctionResponse } from 'starknet';
import { bnToUint256 } from 'starknet/utils/uint256';
import { BASE_URL, STAGING_BASE_URL } from './constants';
import { AvnuOptions, Quote, QuoteRequest, Transaction } from './types';

const getBaseUrl = (): string => (process.env.NODE_ENV === 'dev' ? STAGING_BASE_URL : BASE_URL);

const parseResponse = <T>(response: Response): Promise<T> => {
  if (response.status >= 400) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
};

/**
 * Fetches the best quotes.
 * It allows to find the best quotes from on-chain and off-chain liquidity. The best quotes will be returned and are sorted (best first).
 *
 * @param request: The request params for the avnu API `/swap/v1/quotes` endpoint.
 * @param options: Optional options.
 * @returns The best quotes
 */
const getQuotes = (request: QuoteRequest, options?: AvnuOptions): Promise<Quote[]> =>
  fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/quotes?${qs.stringify(request)}`, {
    signal: options?.abortSignal,
  }).then((response) => parseResponse<Quote[]>(response));

/**
 * Build data for executing the exchange through AVNU router
 * It allows trader to build the data needed for executing the exchange on AVNU router
 *
 * @param quoteId: The id of the selected quote
 * @param options: Optional options.
 * @returns The transaction
 */
const buildSwapTransaction = (quoteId: string, options?: AvnuOptions): Promise<Transaction> =>
  fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/build`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quoteId }),
    signal: options?.abortSignal,
  }).then((response) => parseResponse(response));

/**
 * Build approve transaction
 *
 * @param sellTokenAddress: The sell token address
 * @param contractAddress: The avnu contract address
 * @param sellAmount: The sell amount
 * @returns Call
 */
const buildApproveTx = (sellTokenAddress: string, contractAddress: string, sellAmount: BigNumberish): Call => {
  const uint256 = bnToUint256(sellAmount);
  return {
    contractAddress: sellTokenAddress,
    entrypoint: 'approve',
    calldata: [contractAddress, uint256.low, uint256.high],
  };
};

/**
 * Execute approve and swap transactions
 *
 * @param account: The account of the trader
 * @param swapTransaction: The swap transaction (returned by buildSwapTransaction)
 * @param sellTokenAddress: The sell token address
 * @param sellAmount: The sell amount
 * @returns Promise<InvokeFunctionResponse>
 */
const executeSwap = (
  account: AccountInterface,
  swapTransaction: Transaction,
  sellTokenAddress: string,
  sellAmount: BigNumberish,
): Promise<InvokeFunctionResponse> =>
  account.execute([buildApproveTx(sellTokenAddress, swapTransaction.contractAddress, sellAmount), swapTransaction]);

/**
 * Approves and executes the quote
 *
 * @param quoteId: The id of the selected quote
 * @param account: The account of the trader
 * @param sellTokenAddress: The sell token address
 * @param sellAmount: The sell amount
 * @param options: Optional options.
 * @returns Promise<InvokeFunctionResponse>
 */
const approveAndExecuteSwap = (
  quoteId: string,
  account: AccountInterface,
  sellTokenAddress: string,
  sellAmount: BigNumberish,
  options?: AvnuOptions,
): Promise<InvokeFunctionResponse> =>
  buildSwapTransaction(quoteId, options).then((transaction) =>
    executeSwap(account, transaction, sellTokenAddress, sellAmount),
  );

export { approveAndExecuteSwap, buildApproveTx, buildSwapTransaction, executeSwap, getQuotes };
