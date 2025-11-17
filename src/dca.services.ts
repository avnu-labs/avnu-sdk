import qs from 'qs';
import { Call } from 'starknet';
import { executeAllPaymasterFlow } from './paymaster.services';
import { OrderReceiptSchema, PageSchema } from './schemas';
import {
  AvnuOptions,
  CreateDcaOrder,
  GetOrdersParams,
  InvokeCancelDcaParams,
  InvokeCreateDcaParams,
  InvokeTransactionResponse,
  OrderReceipt,
  Page,
} from './types';
import { getBaseUrl, getRequest, parseResponse, parseResponseWithSchema, postRequest } from './utils';

const getDcaOrders = async (
  { traderAddress, status, page, size, sort }: GetOrdersParams,
  options?: AvnuOptions,
): Promise<Page<OrderReceipt>> => {
  const params = qs.stringify({ traderAddress, status, page, size, sort }, { arrayFormat: 'repeat' });

  return fetch(`${getBaseUrl(options)}/dca/v1/orders?${params}`, getRequest(options)).then((response) =>
    parseResponseWithSchema(response, PageSchema(OrderReceiptSchema), options?.avnuPublicKey),
  );
};

const actionToCalls = async (endpoint: string, body: unknown, options?: AvnuOptions): Promise<Call[]> => {
  return fetch(`${getBaseUrl(options)}/dca/v1/orders/${endpoint}`, postRequest(body, options)).then((response) =>
    parseResponse<Call[]>(response, options?.avnuPublicKey),
  );
};

const createDcaToCalls = async (order: CreateDcaOrder, options?: AvnuOptions): Promise<Call[]> =>
  actionToCalls('', order, options);

const cancelDcaToCalls = async (orderAddress: string, options?: AvnuOptions): Promise<Call[]> =>
  actionToCalls(`${orderAddress}/cancel`, undefined, options);

const executeCreateDca = async (
  params: InvokeCreateDcaParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, order } = params;
  const calls = await createDcaToCalls(order, options);

  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }

  const result = await provider.execute(calls);
  return { transactionHash: result.transaction_hash };
};

const executeCancelDca = async (
  params: InvokeCancelDcaParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, orderAddress } = params;
  const calls = await cancelDcaToCalls(orderAddress, options);

  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }

  const result = await provider.execute(calls);
  return { transactionHash: result.transaction_hash };
};

export { cancelDcaToCalls, createDcaToCalls, executeCancelDca, executeCreateDca, getDcaOrders };
