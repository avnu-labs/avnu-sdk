import { toBeHex } from 'ethers';
import qs from 'qs';
import { z } from 'zod';
import { SWAP_API_VERSION } from './constants';
import { executeAllPaymasterFlow } from './paymaster.services';
import { QuoteSchema, SourceSchema } from './schemas';
import {
  AvnuOptions,
  InvokeSwapParams,
  InvokeTransactionResponse,
  Quote,
  QuoteRequest,
  QuoteToCallsParams,
  Source,
  AvnuCalls,
} from './types';
import { getBaseUrl, getRequest, parseResponse, parseResponseWithSchema, postRequest } from './utils';

/**
 * Get the supported sources
 *
 * @param options Optional SDK configuration
 * @returns The available liquidity sources
 */
const getSources = (options?: AvnuOptions): Promise<Source[]> =>
  fetch(`${getBaseUrl(options)}/swap/${SWAP_API_VERSION}/sources`, getRequest(options)).then((response) =>
    parseResponseWithSchema(response, z.array(SourceSchema), options?.avnuPublicKey),
  );

/**
 * Get the best quotes.
 * It allows to find the best quotes from on-chain and off-chain liquidity. The best quotes will be returned and are sorted (best first).
 *
 * @param request The request params for the avnu API `/swap/v2/quotes` endpoint.
 * @param options Optional SDK configuration
 * @returns The best quotes sorted by best first
 */
const getQuotes = (request: QuoteRequest, options?: AvnuOptions): Promise<Quote[]> => {
  if (!request.sellAmount && !request.buyAmount) throw new Error('Sell amount or buy amount is required');
  const queryParams = qs.stringify(
    {
      ...request,
      buyAmount: request.buyAmount ? toBeHex(request.buyAmount) : undefined,
      sellAmount: request.sellAmount ? toBeHex(request.sellAmount) : undefined,
      integratorFees: request.integratorFees ? toBeHex(request.integratorFees) : undefined,
    },
    { arrayFormat: 'repeat' },
  );
  return fetch(`${getBaseUrl(options)}/swap/${SWAP_API_VERSION}/quotes?${queryParams}`, getRequest(options)).then(
    (response) => parseResponseWithSchema(response, z.array(QuoteSchema), options?.avnuPublicKey),
  );
};

/**
 * Build calls for executing the trade through AVNU router
 * It allows trader to build the calls needed for executing the trade on AVNU router
 *
 * @param params The parameters to build the swap calls
 * @param params.quoteId The id of the selected quote
 * @param params.takerAddress Required when taker address was not provided during the quote request
 * @param params.slippage The maximum acceptable slippage of the buyAmount amount (required)
 * @param params.executeApprove If true, the response will contain the approve call. True by default
 * @param options Optional SDK configuration
 * @returns The SwapCalls containing the calls to execute the trade and the chainId
 */
const quoteToCalls = (params: QuoteToCallsParams, options?: AvnuOptions): Promise<AvnuCalls> => {
  const { quoteId, takerAddress, slippage, executeApprove } = params;
  return fetch(
    `${getBaseUrl(options)}/swap/${SWAP_API_VERSION}/build`,
    postRequest({ quoteId, takerAddress, slippage, includeApprove: executeApprove }, options),
  ).then((response) => parseResponse<AvnuCalls>(response, options?.avnuPublicKey));
};

/**
 * Execute the swap transaction
 *
 * @param params The swap execution parameters
 * @param params.provider The account which will execute/sign the transaction, must implement the AccountInterface
 * @param params.paymaster The paymaster information, if needed
 * @param params.paymaster.active True if the tx must be executed through a paymaster
 * @param params.paymaster.provider The paymaster provider, must implement the PaymasterInterface
 * @param params.paymaster.params The paymaster parameters
 * @param params.quote The selected quote. See `getQuotes`
 * @param params.executeApprove False if the taker already executed `approve`. Defaults to true
 * @param params.slippage The maximum acceptable slippage for the trade
 * @param options Optional SDK configuration
 * @returns The transaction hash
 */
const executeSwap = async (params: InvokeSwapParams, options?: AvnuOptions): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, quote, executeApprove = true, slippage } = params;

  const chainId = await provider.getChainId();
  if (chainId !== quote.chainId) {
    throw Error(`Invalid chainId`);
  }

  const { calls } = await quoteToCalls(
    { quoteId: quote.quoteId, takerAddress: provider.address, slippage, executeApprove },
    options,
  );

  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }

  const result = await provider.execute(calls);
  return { transactionHash: result.transaction_hash };
};

/**
 * Calculate the min amount received from amount and slippage
 *
 * @param amount The amount to apply slippage
 * @param slippage The slippage to apply in bps. 10 is 0.1%
 * @returns bigint
 */
const calculateMinReceivedAmount = (amount: bigint, slippage: number): bigint =>
  amount - (amount * BigInt(slippage)) / BigInt(10000);

/**
 * Calculate the max amount spent from amount and slippage
 *
 * @param amount The amount to apply slippage
 * @param slippage The slippage to apply in bps. 10 is 0.1%
 * @returns bigint
 */
const calculateMaxSpendAmount = (amount: bigint, slippage: number): bigint =>
  amount + (amount * BigInt(slippage)) / BigInt(10000);

export { calculateMaxSpendAmount, calculateMinReceivedAmount, executeSwap, getQuotes, getSources, quoteToCalls };
