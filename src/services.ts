import { BigNumber } from 'ethers';
import qs from 'qs';
import { AccountInterface, Call, Signature, typedData, uint256 } from 'starknet';
import { AVNU_ADDRESS, BASE_URL, STAGING_BASE_URL } from './constants';
import {
  AvnuOptions,
  GetPairsRequest,
  GetTokensRequest,
  InvokeSwapResponse,
  Page,
  Pair,
  Quote,
  QuoteRequest,
  RequestError,
  Token,
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
 * Executing the exchange through AVNU router
 *
 * @param quoteId: The id of the selected quote
 * @param takerSignature: Required when taker address was not provided during the quote request
 * @param nonce: Taker's address nonce. See `buildGetNonce`
 * @param takerAddress: Required when taker address was not provided during the quote request
 * @param options: Optional options.
 * @returns The transaction hash
 */
const executeSwapTransaction = (
  quoteId: string,
  takerSignature: Signature,
  nonce: string,
  takerAddress?: string,
  options?: AvnuOptions,
): Promise<InvokeSwapResponse> =>
  fetch(`${options?.baseUrl ?? getBaseUrl()}/swap/v1/execute`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quoteId,
      takerAddress,
      nonce,
      takerSignature: takerSignature.map((signature) => BigNumber.from(signature).toHexString()),
    }),
  }).then((response) => parseResponse<InvokeSwapResponse>(response));

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
 * Build approve call
 *
 * @param sellTokenAddress: The sell token address
 * @param sellAmount: The sell amount
 * @param chainId: The chainId
 * @param dev: Specify if you need to use the dev environment  * @returns Call
 */
const buildApproveTx = (sellTokenAddress: string, sellAmount: BigNumber, chainId: string, dev?: boolean): Call => {
  const value = uint256.bnToUint256(sellAmount.toHexString());
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
  calldata: [BigNumber.from(takerAddress).toString()],
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
      taker_token_amount: quote.sellAmount.toHexString(),
      maker_address: quote.sources[0].address,
      maker_token_address: quote.buyTokenAddress,
      maker_token_amount: quote.buyAmount.toHexString(),
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
        taker_token_amount: quote.sellAmount.toHexString(),
        maker_address: quote.sources[0].address,
        maker_token_address: quote.buyTokenAddress,
        maker_token_amount: quote.buyAmount.toHexString(),
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
 * @param takerSignature: Optional: the function will ask the user tu sign the quote if param is undefined
 * @param options: Optional options.
 * @returns Promise<InvokeSwapResponse>
 */
const executeSwap = async (
  account: AccountInterface,
  quote: Quote,
  nonce: string,
  executeApprove = true,
  takerSignature?: Signature,
  options?: AvnuOptions,
): Promise<InvokeSwapResponse> => {
  if (account.chainId !== quote.chainId) {
    throw Error(`Invalid chainId`);
  }
  if (executeApprove) {
    const approve = buildApproveTx(quote.sellTokenAddress, quote.sellAmount, quote.chainId, options?.dev);
    await account.execute([approve]);
  }
  takerSignature = takerSignature ?? (await signQuote(account, quote, nonce, quote.chainId));
  return executeSwapTransaction(quote.quoteId, takerSignature, nonce, account.address, options);
};

export {
  buildApproveTx,
  buildGetNonce,
  executeSwap,
  executeSwapTransaction,
  getPairs,
  getQuotes,
  getTokens,
  hashQuote,
  signQuote,
};
