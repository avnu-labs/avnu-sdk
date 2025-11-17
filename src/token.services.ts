import qs from 'qs';
import z from 'zod';
import { PageSchema, TokenBalanceSchema, TokenSchema } from './schemas';
import { AvnuOptions, GetTokensRequest, Page, Token, TokenBalance } from './types';
import { getBaseUrl, getRequest, parseResponseWithSchema } from './utils';

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
      search: request?.search,
      tag: request?.tags,
    },
    { arrayFormat: 'repeat' },
  );
  return fetch(`${getBaseUrl(options)}/v1/starknet/tokens?${queryParams}`, getRequest(options)).then((response) =>
    parseResponseWithSchema(response, PageSchema(TokenSchema), options?.avnuPublicKey),
  );
};

const fetchTokenByAddress = async (tokenAddress: string, options?: AvnuOptions): Promise<Token> => {
  return fetch(`${getBaseUrl(options)}/v1/starknet/tokens/${tokenAddress}`, getRequest(options)).then((response) =>
    parseResponseWithSchema(response, TokenSchema, options?.avnuPublicKey),
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

// Cacher
const fetchTokensBalances = async (
  userAddress: string,
  tokens: Token[],
  options?: AvnuOptions,
): Promise<TokenBalance[]> => {
  const queryParams = qs.stringify(
    { userAddress, tokenAddress: tokens.map((token) => token.address) },
    { arrayFormat: 'repeat' },
  );
  return fetch(`${getBaseUrl(options)}/v1/starknet/balances?${queryParams}`, getRequest(options)).then((response) =>
    parseResponseWithSchema(response, z.array(TokenBalanceSchema), options?.avnuPublicKey),
  );
};

// Cacher -> get transaction recepit

export { fetchTokenByAddress, fetchTokens, fetchTokensBalances, fetchVerifiedTokenBySymbol };
