import { toBeHex } from 'ethers';
import qs from 'qs';
import { AccountInterface, Call, ec, hash, Signature, typedData, uint256 } from 'starknet';
import { AVNU_ADDRESS, BASE_URL, STAGING_BASE_URL } from './constants';
import {
  AvnuOptions,
  BuildSwapTransaction,
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
      prices.map((price) => ({ ...price, sellAmount: BigInt(price.sellAmount), buyAmount: BigInt(price.buyAmount) })),
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
      sellAmount: toBeHex(request.sellAmount),
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
        avnuFees: BigInt(quote.avnuFees),
        integratorFees: BigInt(quote.integratorFees),
        avnuFeesBps: BigInt(quote.avnuFeesBps),
        integratorFeesBps: BigInt(quote.integratorFeesBps),
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
  takerSignature: Signature,
  nonce: string,
  takerAddress?: string,
  slippage?: number,
  options?: AvnuOptions,
): Promise<InvokeSwapResponse> => {
  let signature: string[] = [];

  if (Array.isArray(takerSignature)) {
    signature = takerSignature.map((sig) => toBeHex(BigInt(sig)));
  } else if (takerSignature.r && takerSignature.s) {
    signature = [toBeHex(BigInt(takerSignature.r)), toBeHex(BigInt(takerSignature.s))];
  }
  return fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/execute`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.avnuPublicKey && { 'ask-signature': 'true' }),
    },
    body: JSON.stringify({
      quoteId,
      takerAddress,
      nonce,
      slippage,
      takerSignature: signature,
    }),
  }).then((response) => parseResponse<InvokeSwapResponse>(response, options?.avnuPublicKey));
};

/**
 * Build data for executing the exchange through AVNU router
 * It allows trader to build the data needed for executing the exchange on AVNU router
 *
 * @param quoteId: The id of the selected quote
 * @param nonce: Taker's address nonce. See `buildGetNonce`. Warning: the nonce mechanism will change
 * @param takerAddress: Required when taker address was not provided during the quote request
 * @param slippage: The maximum acceptable slippage of the buyAmount amount. Default value is 5%. 0.05 is 5%.
 * This value is ignored if slippage is not applicable to the selected quote
 * @param options: Optional options.
 * @returns The calldata
 */
const fetchBuildExecuteTransaction = (
  quoteId: string,
  nonce?: string,
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
    body: JSON.stringify({ quoteId, takerAddress, nonce, slippage }),
  }).then((response) => parseResponse<BuildSwapTransaction>(response, options?.avnuPublicKey));

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
 * Build getNonce call
 *
 * @param takerAddress: The taker's address
 * @param chainId: The chainId
 * @param dev: Specify if you need to use the dev environment
 * @returns Call
 */
const buildGetNonce = (takerAddress: string, chainId: string, dev?: boolean): Call => ({
  contractAddress: dev ? AVNU_ADDRESS[`${chainId}-dev`] : AVNU_ADDRESS[chainId],
  entrypoint: 'getNonce',
  calldata: [BigInt(takerAddress).toString()],
});

/**
 * Sign the quote
 * The signature will be used in the AVNU contract
 *
 * @param account: The account of the trader
 * @param quote: The selected quote. See `getQuotes`
 * @param nonce: Taker's address nonce. See `buildGetNonce`
 * @param chainId: The chainId
 * @returns Call
 */
const signQuote = (account: AccountInterface, quote: Quote, nonce: string, chainId: string): Promise<Signature> =>
  account.signMessage({
    domain: { name: 'AVNUFinance', version: '1', chainId: chainId },
    message: {
      taker_address: account.address,
      taker_token_address: quote.sellTokenAddress,
      taker_token_amount: toBeHex(quote.sellAmount),
      maker_address: quote.routes[0].address,
      maker_token_address: quote.buyTokenAddress,
      maker_token_amount: toBeHex(quote.buyAmount),
      nonce,
    },
    primaryType: 'TakerMessage',
    types: {
      StarkNetDomain: [
        { name: 'name', type: 'felt' },
        { name: 'version', type: 'felt' },
        { name: 'chainId', type: 'felt' },
      ],
      TakerMessage: [
        { name: 'taker_address', type: 'felt' },
        { name: 'taker_token_address', type: 'felt' },
        { name: 'taker_token_amount', type: 'felt' },
        { name: 'maker_address', type: 'felt' },
        { name: 'maker_token_address', type: 'felt' },
        { name: 'maker_token_amount', type: 'felt' },
        { name: 'nonce', type: 'felt' },
      ],
    },
  });

const hashQuote = (accountAddress: string, quote: Quote, nonce: string, chainId: string): string =>
  typedData.getMessageHash(
    {
      domain: { name: 'AVNUFinance', version: '1', chainId: chainId },
      message: {
        taker_address: accountAddress,
        taker_token_address: quote.sellTokenAddress,
        taker_token_amount: toBeHex(quote.sellAmount),
        maker_address: quote.routes[0].address,
        maker_token_address: quote.buyTokenAddress,
        maker_token_amount: toBeHex(quote.buyAmount),
        nonce,
      },
      primaryType: 'TakerMessage',
      types: {
        StarkNetDomain: [
          { name: 'name', type: 'felt' },
          { name: 'version', type: 'felt' },
          { name: 'chainId', type: 'felt' },
        ],
        TakerMessage: [
          { name: 'taker_address', type: 'felt' },
          { name: 'taker_token_address', type: 'felt' },
          { name: 'taker_token_amount', type: 'felt' },
          { name: 'maker_address', type: 'felt' },
          { name: 'maker_token_address', type: 'felt' },
          { name: 'maker_token_amount', type: 'felt' },
          { name: 'nonce', type: 'felt' },
        ],
      },
    },
    accountAddress,
  );

/**
 * Execute the exchange
 *
 * @param account: The account of the trader
 * @param quote: The selected quote. See `getQuotes`
 * @param nonce: Taker's address nonce. See `buildGetNonce`
 * @param executeApprove: False if the taker already executed `approve`
 * @param gasless: False if the user wants to execute the transaction himself
 * @param takerSignature: Optional: the function will ask the user tu sign the quote if param is undefined
 * @param slippage: The maximum acceptable slippage of the buyAmount amount. Default value is 5%. 0.05 is 5%.
 * This value is ignored if slippage is not applicable to the selected quote
 * @param options: Optional options.
 * @returns Promise<InvokeSwapResponse>
 */
const executeSwap = async (
  account: AccountInterface,
  quote: Quote,
  { executeApprove = true, gasless = false, takerSignature, slippage }: ExecuteSwapOptions = {},
  options?: AvnuOptions,
): Promise<InvokeSwapResponse> => {
  const chainId = await account.getChainId();
  if (chainId !== quote.chainId) {
    throw Error(`Invalid chainId`);
  }

  const approve = executeApprove
    ? buildApproveTx(quote.sellTokenAddress, quote.sellAmount, quote.chainId, options?.dev)
    : undefined;

  // /!\ Do not implement this yourself. It will change /!\
  let nonce = undefined;
  if (quote.liquiditySource === 'MARKET_MAKER' || gasless) {
    const getNonce = buildGetNonce(account.address, chainId, options?.dev);
    const response = await account.callContract(getNonce);
    nonce = response.result[0];
  }

  if (gasless) {
    if (approve) await account.execute([approve]);
    takerSignature = takerSignature ?? (await signQuote(account, quote, nonce!, quote.chainId));
    return fetchExecuteSwapTransaction(quote.quoteId, takerSignature, nonce!, account.address, slippage, options);
  } else {
    return fetchBuildExecuteTransaction(quote.quoteId, nonce, account.address, slippage, options)
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

export {
  buildApproveTx,
  buildGetNonce,
  calculateMinAmount,
  checkContractAddress,
  executeSwap,
  fetchBuildExecuteTransaction,
  fetchExecuteSwapTransaction,
  fetchPrices,
  fetchQuotes,
  fetchSources,
  fetchTokens,
  hashQuote,
  signQuote,
};
