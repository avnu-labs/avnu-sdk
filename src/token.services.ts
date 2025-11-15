import qs from 'qs';
import { AvnuOptions, GetTokensRequest, Page, Token } from './types';
import { getBaseUrl, getRequest, parseResponse } from './utils';

/**
 * Fetches exchangeable tokens from the API.
 * You can filter tokens by tags and search for specific tokens.
 *
 * @param request The request params for the avnu API `/swap/v1/starknet/tokens` endpoint.
 * @param options Optional options.
 * @returns The best quotes
 */
const fetchTokens = async (request?: GetTokensRequest, options?: AvnuOptions): Promise<Page<Token>> => {
  const queryParams = qs.stringify(
    {
      page: request?.page,
      size: request?.size,
      search: request?.size,
      tag: request?.tags,
    },
    { arrayFormat: 'repeat' },
  );
  return fetch(`${getBaseUrl(options)}/v1/starknet/tokens?${queryParams}`, getRequest(options)).then((response) =>
    parseResponse<Page<Token>>(response, options?.avnuPublicKey),
  );
};

const fetchTokenByAddress = async (tokenAddress: string, options?: AvnuOptions): Promise<Token> => {
  return fetch(`${getBaseUrl(options)}/v1/starknet/tokens/${tokenAddress}`, getRequest(options)).then((response) =>
    parseResponse<Token>(response, options?.avnuPublicKey),
  );
};

const fetchVerifiedTokenBySymbol = async (symbol: string, options?: AvnuOptions): Promise<Token | undefined> => {
  return fetchTokens({ page: 0, size: 1, tags: ['Verified', 'Unruggable'], search: symbol }, options).then((page) => {
    const token = page.content[0];
    if (token && token.symbol.toLowerCase() === symbol.toLowerCase()) {
      return token;
    }
    throw undefined;
  });
};

export { fetchTokenByAddress, fetchTokens, fetchVerifiedTokenBySymbol };
