import { toBeHex } from 'ethers';
import qs from 'qs';
import { AccountInterface, Call, ec, hash, Signature, TypedData, uint256 } from 'starknet';
import { AVNU_ADDRESS, BASE_URL, STAGING_BASE_URL } from './constants';
import {
  AvnuOptions,
  BuildSwapTransaction,
  ContractError,
  ExecuteSwapOptions,
  GetTokensRequest,
  InvokeSwapResponse,
  Page,
  Price,
  PriceRequest,
  Quote,
  QuoteRequest,
  RequestError,
  Source,
  Token,
} from './types';

const getBaseUrl = (): string => (process.env.NODE_ENV === 'dev' ? STAGING_BASE_URL : BASE_URL);

const parseResponse = <T>(response: Response, avnuPublicKey?: string): Promise<T> => {
  if (response.status === 400) {
    return response.json().then((error: RequestError) => {
      throw new Error(error.messages[0]);
    });
  }
  if (response.status === 500) {
    return response.json().then((error: RequestError) => {
      if (error.messages.length >= 0 && error.messages[0].includes('Contract error')) {
        throw new ContractError(error.messages[0], error.revertError || '');
      } else {
        throw new Error(error.messages[0]);
      }
    });
  }
  if (response.status > 400) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  if (avnuPublicKey) {
    const signature = response.headers.get('signature');
    if (!signature) throw new Error('No server signature');
    return response
      .clone()
      .text()
      .then((textResponse) => {
        const hashResponse = hash.computeHashOnElements([hash.starknetKeccak(textResponse)]);
        const formattedSig = signature.split(',').map((s) => BigInt(s));
        const signatureType = new ec.starkCurve.Signature(formattedSig[0], formattedSig[1]);
        if (!ec.starkCurve.verify(signatureType, hashResponse, avnuPublicKey))
          throw new Error('Invalid server signature');
      })
      .then(() => response.json());
  }
  return response.json();
};

/**
 * Fetches the prices of DEX applications.
 * It allows to find the prices of AMM without any path optimization. It allows to measure the performance of the results from the getQuotes endpoints. The prices are sorted (best first).
 *
 * @param request: The request params for the avnu API `/swap/v1/prices` endpoint.
 * @param options: Optional options.
 * @returns The best quotes
 */
const fetchPrices = (request: PriceRequest, options?: AvnuOptions): Promise<Price[]> => {
  const queryParams = qs.stringify({ ...request, sellAmount: toBeHex(request.sellAmount) }, { arrayFormat: 'repeat' });
  return fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/prices?${queryParams}`, {
    signal: options?.abortSignal,
    headers: { ...(options?.avnuPublicKey !== undefined && { 'ask-signature': 'true' }) },
  })
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
 * @param request: The request params for the avnu API `/swap/v1/quotes` endpoint.
 * @param options: Optional options.
 * @returns The best quotes
 */
const fetchQuotes = (request: QuoteRequest, options?: AvnuOptions): Promise<Quote[]> => {
  const queryParams = qs.stringify(
    {
      ...request,
      ...(request.sellAmount && { sellAmount: toBeHex(request.sellAmount) }),
      ...(request.buyAmount && { buyAmount: toBeHex(request.buyAmount) }),
      integratorFees: request.integratorFees ? toBeHex(request.integratorFees) : undefined,
    },
    { arrayFormat: 'repeat' },
  );
  return fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/quotes?${queryParams}`, {
    signal: options?.abortSignal,
    headers: { ...(options?.avnuPublicKey !== undefined && { 'ask-signature': 'true' }) },
  })
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
            price: BigInt(gasTokenPrice.price),
            gasFeesInGasToken: BigInt(gasTokenPrice.gasFeesInGasToken),
          })),
        },
        suggestedSolution: quote.suggestedSolution && {
          ...quote.suggestedSolution,
          sellAmount: BigInt(quote.suggestedSolution.sellAmount),
          buyAmount: BigInt(quote.suggestedSolution.buyAmount),
        },
      })),
    );
};

const fetchQuotesLucky = (request: QuoteRequest, options?: AvnuOptions): Promise<Quote[]> => {
  if (request.sellAmount == undefined) {
    throw Error(`sell amount should be defined`);
  }
  const queryParams = qs.stringify(
    {
      sellTokenAddress: request.sellTokenAddress,
      sellAmountMax: toBeHex(request.sellAmount!),
      takerAddress: request.takerAddress,
      excludeSources: request.excludeSources,
      size: request.size,
    },
    { arrayFormat: 'repeat' },
  );
  return fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/quotes-lucky?${queryParams}`, {
    signal: options?.abortSignal,
    headers: { ...(options?.avnuPublicKey !== undefined && { 'ask-signature': 'true' }) },
  })
    .then((response) => parseResponse<Quote[]>(response))
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
        suggestedSolution: quote.suggestedSolution
          ? {
              ...quote.suggestedSolution,
              sellAmount: BigInt(quote.suggestedSolution.sellAmount),
              buyAmount: BigInt(quote.suggestedSolution.buyAmount),
            }
          : undefined,
      })),
    );
};

/**
 * Executing the exchange through AVNU router
 *
 * @param quoteId: The id of the selected quote
 * @param takerSignature: Taker's signature.
 * @param nonce: Taker's address nonce. See `buildGetNonce`
 * @param takerAddress: Required when taker address was not provided during the quote request
 * @param slippage: The maximum acceptable slippage of the buyAmount amount. Default value is 5%. 0.05 is 5%.
 * This value is ignored if slippage is not applicable to the selected quote
 * @param options: Optional options.
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
  return fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/execute`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.avnuPublicKey && { 'ask-signature': 'true' }),
    },
    body: JSON.stringify({ quoteId, signature }),
  }).then((response) => parseResponse<InvokeSwapResponse>(response, options?.avnuPublicKey));
};

/**
 * Build data for executing the exchange through AVNU router
 * It allows trader to build the data needed for executing the exchange on AVNU router
 *
 * @param quoteId: The id of the selected quote
 * @param takerAddress: Required when taker address was not provided during the quote request
 * @param slippage: The maximum acceptable slippage of the buyAmount amount. Default value is 5%. 0.05 is 5%.
 * This value is ignored if slippage is not applicable to the selected quote
 * @param options: Optional options.
 * @returns The calldata
 */
const fetchBuildExecuteTransaction = (
  quoteId: string,
  takerAddress?: string,
  slippage?: number,
  options?: AvnuOptions,
): Promise<BuildSwapTransaction> =>
  fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/build`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.avnuPublicKey && { 'ask-signature': 'true' }),
    },
    body: JSON.stringify({ quoteId, takerAddress, slippage }),
  }).then((response) => parseResponse<BuildSwapTransaction>(response, options?.avnuPublicKey));

/**
 * Build typed-data. Once signed by the user, the signature can be sent to the API to be executed by AVNU
 *
 * @param quoteId: The id of the selected quote
 * @param withApprove: If true, the typed data will contains the approve call
 * @param takerAddress: Required when taker address was not provided during the quote request
 * @param slippage: The maximum acceptable slippage of the buyAmount amount. Default value is 5%. 0.05 is 5%.
 * This value is ignored if slippage is not applicable to the selected quote
 * @param options: Optional options.
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
  fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/build-typed-data`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.avnuPublicKey && { 'ask-signature': 'true' }),
    },
    body: JSON.stringify({
      quoteId,
      takerAddress,
      slippage,
      includeApprove,
      gasTokenAddress,
      maxGasTokenAmount: toBeHex(maxGasTokenAmount),
    }),
  }).then((response) => parseResponse<TypedData>(response, options?.avnuPublicKey));

/**
 * Fetches the supported tokens.
 *
 * @param request: The request params for the avnu API `/swap/v1/tokens` endpoint.
 * @param options: Optional options.
 * @returns The best quotes
 */
const fetchTokens = (request?: GetTokensRequest, options?: AvnuOptions): Promise<Page<Token>> =>
  fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/tokens?${qs.stringify(request ?? {})}`, {
    signal: options?.abortSignal,
    headers: { ...(options?.avnuPublicKey && { 'ask-signature': 'true' }) },
  }).then((response) => parseResponse<Page<Token>>(response, options?.avnuPublicKey));

/**
 * Fetches the supported sources
 *
 * @param options: Optional options.
 * @returns The sources
 */
const fetchSources = (options?: AvnuOptions): Promise<Source[]> =>
  fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/sources`, {
    signal: options?.abortSignal,
    headers: { ...(options?.avnuPublicKey && { 'ask-signature': 'true' }) },
  }).then((response) => parseResponse<Source[]>(response, options?.avnuPublicKey));

/**
 * Verifies if the address is whitelisted
 * Throws an error when the contractAddress is not whitelisted
 *
 * @param contractAddress: The address to check
 * @param chainId: The chainId
 */
const checkContractAddress = (contractAddress: string, chainId: string, dev?: boolean) => {
  if (!(dev ? AVNU_ADDRESS[`${chainId}-dev`] : AVNU_ADDRESS[chainId])?.includes(contractAddress)) {
    throw Error(`Contract ${contractAddress} is not whitelisted`);
  }
};

/**
 * Build approve call
 *
 * @param sellTokenAddress: The sell token address
 * @param sellAmount: The sell amount
 * @param chainId: The chainId
 * @param dev: Specify if you need to use the dev environment  * @returns Call
 */
const buildApproveTx = (sellTokenAddress: string, sellAmount: bigint, chainId: string, dev?: boolean): Call => {
  const value = uint256.bnToUint256(toBeHex(sellAmount));
  return {
    contractAddress: sellTokenAddress,
    entrypoint: 'approve',
    calldata: [dev ? AVNU_ADDRESS[`${chainId}-dev`] : AVNU_ADDRESS[chainId], value.low, value.high],
  };
};

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

  const approve = executeApprove
    ? quote.exactTokenTo == true
      ? buildApproveTx(
          quote.sellTokenAddress,
          quote.sellAmount + computeSlippageAmount(quote.sellAmount, slippage),
          quote.chainId,
          options?.dev,
        )
      : buildApproveTx(quote.sellTokenAddress, quote.sellAmount, quote.chainId, options?.dev)
    : undefined;

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
    }));
  } else {
    return fetchBuildExecuteTransaction(quote.quoteId, account.address, slippage, options)
      .then((call) => {
        checkContractAddress(call.contractAddress, call.chainId, options?.dev);
        return account.execute(approve ? [approve, call] : [call]);
      })
      .then((value) => ({ transactionHash: value.transaction_hash }));
  }
};

/**
 * Calculate the min amount received from amount and slippage
 *
 * @param amount: The amount to apply slippage
 * @param slippage: The slippage to apply in bps. 10 is 0.1%
 * @returns bigint
 */
const calculateMinAmount = (amount: bigint, slippage: number): bigint =>
  amount - (amount * BigInt(slippage)) / BigInt(10000);

const computeSlippageAmount = (amount: bigint, slippage: number): bigint =>
  BigInt(Math.floor(Number(amount) * slippage));

export {
  buildApproveTx,
  calculateMinAmount,
  checkContractAddress,
  executeSwap,
  fetchBuildExecuteTransaction,
  fetchBuildSwapTypedData,
  fetchExecuteSwapTransaction,
  fetchPrices,
  fetchQuotes,
  fetchQuotesLucky,
  fetchSources,
  fetchTokens,
};
