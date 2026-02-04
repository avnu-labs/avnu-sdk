import { ec, hash } from 'starknet';
import { z } from 'zod';
import { BASE_URL, IMPULSE_BASE_URL } from './constants';
import { AvnuOptions, ContractError, RequestError } from './types';

export const getBaseUrl = (options?: AvnuOptions): string => options?.baseUrl ?? BASE_URL;

export const getImpulseBaseUrl = (options?: AvnuOptions): string => options?.impulseBaseUrl ?? IMPULSE_BASE_URL;

export const getRequest = (options?: AvnuOptions): RequestInit => ({
  signal: options?.abortSignal,
  headers: {
    ...(options?.avnuPublicKey !== undefined && { 'ask-signature': 'true' }),
  },
});
export const postRequest = (body: unknown, options?: AvnuOptions): RequestInit => ({
  method: 'POST',
  signal: options?.abortSignal,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options?.avnuPublicKey !== undefined && { 'ask-signature': 'true' }),
  },
  ...(body !== undefined && { body: JSON.stringify(body) }),
});

/**
 * Parse API response
 * @param response The fetch Response object
 * @param avnuPublicKey Optional public key for signature verification
 * @returns The parsed response if the response is successful
 * @throws An error if the response is not successful
 */
export const parseResponse = <T>(response: Response, avnuPublicKey?: string): Promise<T> => {
  if (response.status === 400) {
    return response.json().then((error: RequestError) => {
      const message = error?.messages?.[0] ?? 'Bad request';
      throw new Error(message);
    });
  }
  if (response.status === 500) {
    return response.json().then((error: RequestError) => {
      const message = error?.messages?.[0] ?? 'Internal server error';
      if (message.includes('Contract error')) {
        throw new ContractError(message, error?.revertError || '');
      }
      throw new Error(message);
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
 * Parse API response with Zod schema validation and transformation
 * @param response The fetch Response object
 * @param schema Zod schema for validation and transformation
 * @param avnuPublicKey Optional public key for signature verification
 * @returns Parsed and validated data
 */
export const parseResponseWithSchema = <T extends z.ZodTypeAny>(
  response: Response,
  schema: T,
  avnuPublicKey?: string,
): Promise<z.infer<T>> => {
  return parseResponse<unknown>(response, avnuPublicKey).then((data) => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid API response: ${error.message}`);
      }
      throw error;
    }
  });
};
