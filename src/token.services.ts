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

export { fetchTokens };
