import { toBeHex } from 'ethers';
import qs from 'qs';
import { AccountInterface, Signature, TypedData } from 'starknet';
import {
  AvnuOptions,
  BuildSwapTransaction,
  ExecuteSwapOptions,
  InvokeSwapResponse,
  Price,
  PriceRequest,
  Quote,
  QuoteRequest,
  Source,
} from './types';
import { getBaseUrl, getRequest, parseResponse, postRequest } from './utils';

/**
 * Fetches the prices of DEX applications.
 * It allows to find the prices of AMM without any path optimization. It allows to measure the performance of the results from the getQuotes endpoints. The prices are sorted (best first).
 *
 * @returns The best quotes
 * @param request The request params for the avnu API `/swap/v2/prices` endpoint.
 * @param options Optional options.
 */
const fetchPrices = (request: PriceRequest, options?: AvnuOptions): Promise<Price[]> => {
  const queryParams = qs.stringify({ ...request, sellAmount: toBeHex(request.sellAmount) }, { arrayFormat: 'repeat' });
  return fetch(`${getBaseUrl(options)}/swap/v2/prices?${queryParams}`, getRequest(options))
    .then((response) => parseResponse<Price[]>(response, options?.avnuPublicKey))
    .then((prices) =>
      prices.map((price) => ({
        ...price,
        sellAmount: BigInt(price.sellAmount),
        buyAmount: BigInt(price.buyAmount),
        gasFees: BigInt(price.gasFees),
      })),
    );
};

/**
 * Fetches the best quotes.
 * It allows to find the best quotes from on-chain and off-chain liquidity. The best quotes will be returned and are sorted (best first).
 *
 * @param request The request params for the avnu API `/swap/v2/quotes` endpoint.
 * @param options Optional options.
 * @returns The best quotes
 */
const fetchQuotes = (request: QuoteRequest, options?: AvnuOptions): Promise<Quote[]> => {
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
  return fetch(`${getBaseUrl(options)}/swap/v2/quotes?${queryParams}`, getRequest(options))
    .then((response) => parseResponse<Quote[]>(response, options?.avnuPublicKey))
    .then((quotes) =>
      quotes.map((quote) => ({
        ...quote,
        sellAmount: BigInt(quote.sellAmount),
        buyAmount: BigInt(quote.buyAmount),
        buyAmountWithoutFees: BigInt(quote.buyAmountWithoutFees),
        gasFees: BigInt(quote.gasFees),
        avnuFees: BigInt(quote.avnuFees),
        integratorFees: BigInt(quote.integratorFees),
        avnuFeesBps: BigInt(quote.avnuFeesBps),
        integratorFeesBps: BigInt(quote.integratorFeesBps),
        gasless: quote.gasless && {
          active: quote.gasless.active,
          gasTokenPrices: quote.gasless.gasTokenPrices.map((gasTokenPrice) => ({
            tokenAddress: gasTokenPrice.tokenAddress,
            gasFeesInUsd: gasTokenPrice.gasFeesInUsd,
            gasFeesInGasToken: BigInt(gasTokenPrice.gasFeesInGasToken),
          })),
        },
      })),
    );
};

/**
 * Executing the exchange through AVNU router
 *
 * @param quoteId The id of the selected quote
 * @param signature The typed data's signature
 * @param options Optional options.
 * @returns The transaction hash
 */
const fetchExecuteSwapTransaction = (
  quoteId: string,
  signature: Signature,
  options?: AvnuOptions,
): Promise<InvokeSwapResponse> => {
  if (Array.isArray(signature)) {
    signature = signature.map((sig) => toBeHex(BigInt(sig)));
  } else if (signature.r && signature.s) {
    signature = [toBeHex(BigInt(signature.r)), toBeHex(BigInt(signature.s))];
  }
  return fetch(`${getBaseUrl(options)}/swap/v2/execute`, postRequest({ quoteId, signature }, options)).then(
    (response) => parseResponse<InvokeSwapResponse>(response, options?.avnuPublicKey),
  );
};

/**
 * Build data for executing the exchange through AVNU router
 * It allows trader to build the data needed for executing the exchange on AVNU router
 *
 * @param quoteId The id of the selected quote
 * @param takerAddress Required when taker address was not provided during the quote request
 * @param slippage The maximum acceptable slippage of the buyAmount amount. Default value is 5%. 0.05 is 5%.
 * This value is ignored if slippage is not applicable to the selected quote
 * @param includeApprove If true, the response will contain the approve call. True by default.
 * @param options Optional options.
 * @returns The calldata
 */
const fetchBuildExecuteTransaction = (
  quoteId: string,
  takerAddress?: string,
  slippage?: number,
  includeApprove?: boolean,
  options?: AvnuOptions,
): Promise<BuildSwapTransaction> =>
  fetch(
    `${getBaseUrl(options)}/swap/v2/build`,
    postRequest({ quoteId, takerAddress, slippage, includeApprove }, options),
  ).then((response) => parseResponse<BuildSwapTransaction>(response, options?.avnuPublicKey));

/**
 * Build typed-data. Once signed by the user, the signature can be sent to the API to be executed by AVNU
 *
 * @param quoteId The id of the selected quote
 * @param gasTokenAddress The gas token address that will be used to pay the gas fees
 * @param maxGasTokenAmount The maximum amount of gas token the user accepts to spend
 * @param includeApprove If true, the typed data will contains the approve call
 * @param takerAddress Required when taker address was not provided during the quote request
 * @param slippage The maximum acceptable slippage of the buyAmount amount. Default value is 5%. 0.05 is 5%.
 * This value is ignored if slippage is not applicable to the selected quote
 * @param options Optional options.
 * @returns The calldata
 */
const fetchBuildSwapTypedData = (
  quoteId: string,
  gasTokenAddress: string,
  maxGasTokenAmount: bigint,
  includeApprove: boolean = true,
  takerAddress?: string,
  slippage?: number,
  options?: AvnuOptions,
): Promise<TypedData> =>
  fetch(
    `${getBaseUrl(options)}/swap/v2/build-typed-data`,
    postRequest(
      {
        quoteId,
        takerAddress,
        slippage,
        includeApprove,
        gasTokenAddress,
        maxGasTokenAmount: toBeHex(maxGasTokenAmount),
      },
      options,
    ),
  ).then((response) => parseResponse<TypedData>(response, options?.avnuPublicKey));

/**
 * Fetches the supported sources
 *
 * @param options Optional options.
 * @returns The sources
 */
const fetchSources = (options?: AvnuOptions): Promise<Source[]> =>
  fetch(`${getBaseUrl(options)}/swap/v2/sources`, getRequest(options)).then((response) =>
    parseResponse<Source[]>(response, options?.avnuPublicKey),
  );

/**
 * Execute the exchange
 *
 * @param account The account of the trader
 * @param quote The selected quote. See `getQuotes`
 * @param executeApprove False if the taker already executed `approve`
 * @param gasless False if the user wants to execute the transaction himself
 * @param gasTokenAddress The gas token address that will be used to pay the gas fees (required when gasless is true)
 * @param maxGasTokenAmount The maximum amount of gas token that the user is willing to spend (required when gasless is true)
 * @param executeGaslessTxCallback This function is called after the user signed the typed data and just before calling the API to execute the transaction
 * @param slippage The maximum acceptable slippage of the buyAmount amount. Default value is 5%. 0.05 is 5%.
 * This value is ignored if slippage is not applicable to the selected quote
 * @param options Optional options.
 * @returns Promise<InvokeSwapResponse>
 */
const executeSwap = async (
  account: AccountInterface,
  quote: Quote,
  {
    executeApprove = true,
    gasless = false,
    gasTokenAddress,
    maxGasTokenAmount,
    slippage = 0.005,
    executeGaslessTxCallback,
  }: ExecuteSwapOptions = {},
  options?: AvnuOptions,
): Promise<InvokeSwapResponse> => {
  const chainId = await account.getChainId();
  if (chainId !== quote.chainId) {
    throw Error(`Invalid chainId`);
  }

  if (gasless) {
    if (!gasTokenAddress || !maxGasTokenAmount) {
      throw Error(`Should provide gasTokenAddress and maxGasTokenAmount when gasless is true`);
    }
    const typedData = await fetchBuildSwapTypedData(
      quote.quoteId,
      gasTokenAddress,
      maxGasTokenAmount,
      executeApprove,
      account.address,
      slippage,
      options,
    );
    const signature = await account.signMessage(typedData);
    if (executeGaslessTxCallback) {
      executeGaslessTxCallback();
    }
    return fetchExecuteSwapTransaction(quote.quoteId, signature, options).then((value) => ({
      transactionHash: value.transactionHash,
      gasTokenAddress: value.gasTokenAddress,
      gasTokenAmount: BigInt(value.gasTokenAmount!),
    }));
  } else {
    return fetchBuildExecuteTransaction(quote.quoteId, account.address, slippage, executeApprove, options)
      .then(({ calls }) => account.execute(calls))
      .then((value) => ({ transactionHash: value.transaction_hash }));
  }
};

/**
 * Calculate the min amount received from amount and slippage
 *
 * @param amount The amount to apply slippage
 * @param slippage The slippage to apply in bps. 10 is 0.1%
 * @returns bigint
 */
const calculateMinAmount = (amount: bigint, slippage: number): bigint =>
  amount - (amount * BigInt(slippage)) / BigInt(10000);

export {
  calculateMinAmount,
  executeSwap,
  fetchBuildExecuteTransaction,
  fetchBuildSwapTypedData,
  fetchExecuteSwapTransaction,
  fetchPrices,
  fetchQuotes,
  fetchSources,
};
