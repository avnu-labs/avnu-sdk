import { ec, hash } from 'starknet';
import { BASE_URL, SEPOLIA_BASE_URL } from './constants';
import { AvnuOptions, ContractError, RequestError } from './types';

export const getBaseUrl = (options?: AvnuOptions): string =>
  options?.baseUrl ?? (process.env.NODE_ENV === 'dev' ? SEPOLIA_BASE_URL : BASE_URL);

export const getRequest = (options?: AvnuOptions): RequestInit => ({
  signal: options?.abortSignal,
  headers: {
    ...(options?.avnuPublicKey !== undefined && { 'ask-signature': 'true' }),
  },
});
export const postRequest = (body: unknown, options?: AvnuOptions): RequestInit => ({
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options?.avnuPublicKey && { 'ask-signature': 'true' }),
  },
  ...(body !== undefined && { body: JSON.stringify(body) }),
});

export const parseResponse = <T>(response: Response, avnuPublicKey?: string): Promise<T> => {
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
