import { toBeHex } from 'ethers';
import qs from 'qs';
import { PreparedInvokeTransaction, Signature, TypedData } from 'starknet';
import {
  AvnuOptions,
  InvokeSwapParams,
  InvokeTransactionResponse,
  PaymasterTransactionParams,
  PreparedPaymasterTransaction,
  Price,
  PriceRequest,
  Quote,
  QuoteRequest,
  Source,
  SwapCalls,
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
): Promise<InvokeTransactionResponse> => {
  if (Array.isArray(signature)) {
    signature = signature.map((sig) => toBeHex(BigInt(sig)));
  } else if (signature.r && signature.s) {
    signature = [toBeHex(BigInt(signature.r)), toBeHex(BigInt(signature.s))];
  }
  return fetch(`${getBaseUrl(options)}/swap/v2/execute`, postRequest({ quoteId, signature }, options)).then(
    (response) => parseResponse<InvokeTransactionResponse>(response, options?.avnuPublicKey),
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
const quoteToCalls = (
  {quoteId,
    takerAddress,
    slippage,
    includeApprove,
  }: {quoteId: string, takerAddress?: string, slippage?: number, includeApprove?: boolean},
  options?: AvnuOptions,
) => (
  fetch(`${getBaseUrl(options)}/swap/v2/build`, postRequest({ quoteId, takerAddress, slippage, includeApprove }, options)).then((response) => parseResponse<SwapCalls>(response, options?.avnuPublicKey)))

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

const preparePaymasterTransaction = async ({
  provider,
  paymaster,
  calls,
}: PaymasterTransactionParams): Promise<PreparedPaymasterTransaction> => {
  if (!paymaster.provider || !paymaster.params) {
    throw new Error('Paymaster provider and params are required');
  }
  return (
    paymaster.provider.buildTransaction(
      { type: 'invoke', invoke: { userAddress: provider.address, calls } },
      paymaster.params,
    ) as Promise<PreparedInvokeTransaction>
  ).then(async (result) => {
    const rawSignature = await provider.signMessage(result.typed_data);
    let signature: string[] = [];
    if (Array.isArray(rawSignature)) {
      signature = rawSignature.map((sig) => toBeHex(BigInt(sig)));
    } else if (rawSignature.r && rawSignature.s) {
      signature = [toBeHex(BigInt(rawSignature.r)), toBeHex(BigInt(rawSignature.s))];
    }
    return {
      typedData: result.typed_data,
      signature,
    };
  });
};

const prepareSwapForPaymaster = async (
  { provider, paymaster, quote, executeApprove = true, slippage }: InvokeSwapParams,
  options?: AvnuOptions,
): Promise<PreparedPaymasterTransaction> => {
  if (!paymaster || !paymaster.active) {
    throw new Error('Paymaster is required');
  }
  const callPromise = quoteToCalls({ quoteId: quote.quoteId, takerAddress: provider.address, slippage, includeApprove: executeApprove }, options);
  return callPromise.then(({ calls }) => preparePaymasterTransaction({ provider, paymaster, calls }));
};
/**
 * Execute the exchange
 *
 * @param provider The account which will execute/sign the transaction, must implement the AccountInterface
 * @param paymaster The paymaster information, if needed
 * @param paymaster.active True if the the tx must be executed through a paymaster
 * @param paymaster.provider The paymaster provider, must implement the PaymasterInterface
 * @param paymaster.params The paymaster parameters
 * @param quote The selected quote. See `getQuotes`
 * @param executeApprove False if the taker already executed `approve`
 * @param slippage The maximum acceptable slippage for the trade
 * @param options Optional avnu options
 * @returns Promise<InvokeTransactionResponse | PAYMASTER_API.ExecuteResponse>
 */
const executeSwap = async (
  { provider, paymaster, quote, executeApprove = true, slippage }: InvokeSwapParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const chainId = await provider.getChainId();
  if (chainId !== quote.chainId) {
    throw Error(`Invalid chainId`);
  }
  if (paymaster && paymaster.active) {
    return prepareSwapForPaymaster({ provider, paymaster, quote, executeApprove, slippage }, options)
      .then(({ typedData, signature }) =>
        paymaster.provider.executeTransaction(
          { type: 'invoke', invoke: { userAddress: provider.address, typedData, signature } },
          paymaster.params,
        ),
      )
      .then((value) => ({ transactionHash: value.transaction_hash }));
  }
  return quoteToCalls({ quoteId: quote.quoteId, takerAddress: provider.address, slippage, includeApprove: executeApprove }, options)
    .then(({ calls }) => provider.execute(calls))
    .then((value) => ({ transactionHash: value.transaction_hash }));
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

export {
  calculateMaxSpendAmount,
  calculateMinReceivedAmount,
  executeSwap,
  fetchBuildSwapTypedData,
  fetchExecuteSwapTransaction,
  fetchPrices,
  fetchQuotes,
  fetchSources,
  prepareSwapForPaymaster,
  quoteToCalls,
};
