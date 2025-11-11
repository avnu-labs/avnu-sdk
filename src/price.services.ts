import { AvnuOptions, TokenPriceResponse } from './types';
import { getImpulseBaseUrl, parseResponse, postRequest } from './utils';

const getPrices = (tokenAddresses: string[], options?: AvnuOptions): Promise<TokenPriceResponse> => {
  const requestBody: { tokens: string[] } = {
    tokens: tokenAddresses,
  };
  return fetch(`${getImpulseBaseUrl(options)}/v3/tokens/prices`, postRequest(requestBody, options)).then((response) =>
    parseResponse<TokenPriceResponse>(response, options?.avnuPublicKey),
  );
};

export { getPrices };
