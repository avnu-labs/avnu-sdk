import qs from 'qs';
import { PageSchema, TokenSchema } from './schemas';
import { AvnuOptions, GetTokensRequest, Page, Token } from './types';
import { getBaseUrl, getRequest, parseResponseWithSchema } from './utils';
import { TOKEN_API_VERSION } from './constants';

/**
 * Fetches ERC-20 tokens from the API.
 * You can filter tokens by tags and search for specific tokens by name, symbol or address.
 *
 * @param request.page The page number
 * @param request.size The page size
 * @param request.search The search token name, symbol or address query
 * @param request.tags The tags to filter the tokens (see TokenTag enum)
 * @param options Optional SDK configuration
 * @returns The page of tokens corresponding to the request params
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
  return fetch(`${getBaseUrl(options)}/${TOKEN_API_VERSION}/starknet/tokens?${queryParams}`, getRequest(options)).then((response) =>
    parseResponseWithSchema(response, PageSchema(TokenSchema), options?.avnuPublicKey),
  );
};

/**
 * Fetch a token by address
 * @param tokenAddress The token address
 * @param options Optional SDK configuration
 * @returns The token if found
 */
const fetchTokenByAddress = async (tokenAddress: string, options?: AvnuOptions): Promise<Token> => {
  return fetch(`${getBaseUrl(options)}/${TOKEN_API_VERSION}/starknet/tokens/${tokenAddress}`, getRequest(options)).then((response) =>
    parseResponseWithSchema(response, TokenSchema, options?.avnuPublicKey),
  );
};

/**
 * Fetch a **verified** or **unruggable** token by symbol
 * @param symbol The token symbol
 * @param options Optional SDK configuration
 * @returns The **verified** or **unruggable** token if found
 */
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
