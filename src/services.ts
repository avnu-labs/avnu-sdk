import { BigNumber, BigNumberish } from 'ethers';
import qs from 'qs';
import { AccountInterface, Call, InvokeFunctionResponse } from 'starknet';
import { bnToUint256 } from 'starknet/utils/uint256';
import { BASE_URL, STAGING_BASE_URL, WHITELISTED_ADDRESSES } from './constants';
import {
  AvnuOptions,
  GetPairsRequest,
  GetTokensRequest,
  Page,
  Pair,
  Quote,
  QuoteRequest,
  RequestError,
  Token,
  Transaction,
} from './types';

const getBaseUrl = (): string => (process.env.NODE_ENV === 'dev' ? STAGING_BASE_URL : BASE_URL);

const parseResponse = <T>(response: Response): Promise<T> => {
  if (response.status === 400) {
    return response.json().then((error: RequestError) => {
      throw new Error(error.messages[0]);
    });
  }
  if (response.status > 400) {
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
const getQuotes = (request: QuoteRequest, options?: AvnuOptions): Promise<Quote[]> => {
  const queryParams = qs.stringify({
    ...request,
    sellAmount: request.sellAmount?.toHexString(),
    buyAmount: request.buyAmount?.toHexString(),
  });
  return fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/quotes?${queryParams}`, {
    signal: options?.abortSignal,
  })
    .then((response) => parseResponse<Quote[]>(response))
    .then((quotes) =>
      quotes.map((quote) => ({
        ...quote,
        sellAmount: BigNumber.from(quote.sellAmount),
        buyAmount: BigNumber.from(quote.buyAmount),
        sources: quote.sources.map((source) => ({
          ...source,
          sellAmount: BigNumber.from(source.sellAmount),
          buyAmount: BigNumber.from(source.buyAmount),
        })),
      })),
    );
};

/**
 * Build data for executing the exchange through AVNU router
 * It allows trader to build the data needed for executing the exchange on AVNU router
 *
 * @param quoteId: The id of the selected quote
 * @param takerAddress: Required when taker address was not provided during the quote request
 * @param options: Optional options.
 * @returns The transaction
 */
const buildSwapTransaction = (quoteId: string, takerAddress?: string, options?: AvnuOptions): Promise<Transaction> =>
  fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/build`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quoteId, takerAddress }),
    signal: options?.abortSignal,
  }).then((response) => parseResponse(response));

/**
 * Fetches the supported tokens.
 *
 * @param request: The request params for the avnu API `/swap/v1/tokens` endpoint.
 * @param options: Optional options.
 * @returns The best quotes
 */
const getTokens = (request?: GetTokensRequest, options?: AvnuOptions): Promise<Page<Token>> =>
  fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/tokens?${qs.stringify(request ?? {})}`, {
    signal: options?.abortSignal,
  }).then((response) => parseResponse<Page<Token>>(response));

/**
 * Fetches the supported pairs
 *
 * @param request: The request params for the avnu API `/swap/v1/pairs` endpoint.
 * @param options: Optional options.
 * @returns The best quotes
 */
const getPairs = (request?: GetPairsRequest, options?: AvnuOptions): Promise<Page<Pair>> =>
  fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/pairs?${qs.stringify(request ?? {})}`, {
    signal: options?.abortSignal,
  }).then((response) => parseResponse<Page<Pair>>(response));

/**
 * Verifies if the address is whitelisted
 * Throws an error when the contractAddress is not whitelisted
 *
 * @param contractAddress: The address to check
 * @param chainId: The chainId
 */
const checkAddress = (contractAddress: string, chainId: string) => {
  if (!WHITELISTED_ADDRESSES[chainId]?.includes(contractAddress)) {
    throw Error(`${contractAddress} is not whitelisted`);
  }
};

/**
 * Build approve transaction
 * Could throw an error if the contractAddress is not whitelisted
 *
 * @param sellTokenAddress: The sell token address
 * @param contractAddress: The avnu contract address
 * @param sellAmount: The sell amount
 * @param chainId: The chainId
 * @returns Call
 */
const buildApproveTx = (
  sellTokenAddress: string,
  contractAddress: string,
  sellAmount: BigNumberish,
  chainId: string,
): Call => {
  const uint256 = bnToUint256(sellAmount);
  checkAddress(contractAddress, chainId);
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
): Promise<InvokeFunctionResponse> => {
  if (account.chainId !== swapTransaction.chainId) {
    throw Error(`Invalid chainId`);
  }
  checkAddress(swapTransaction.contractAddress, swapTransaction.chainId);
  return account.execute([
    buildApproveTx(sellTokenAddress, swapTransaction.contractAddress, sellAmount, swapTransaction.chainId),
    swapTransaction,
  ]);
};

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
  buildSwapTransaction(quoteId, account.address, options).then((transaction) =>
    executeSwap(account, transaction, sellTokenAddress, sellAmount),
  );

export {
  approveAndExecuteSwap,
  buildApproveTx,
  buildSwapTransaction,
  checkAddress,
  executeSwap,
  getPairs,
  getQuotes,
  getTokens,
};
