import qs from 'qs';
import { Call } from 'starknet';
import { DCA_API_VERSION } from './constants';
import { executeAllPaymasterFlow } from './paymaster.services';
import { DcaOrderSchema, PageSchema } from './schemas';
import {
  AvnuCalls,
  AvnuOptions,
  CreateDcaOrder,
  DcaOrder,
  GetDcaOrdersParams,
  InvokeCancelDcaParams,
  InvokeCreateDcaParams,
  InvokeTransactionResponse,
  Page,
} from './types';
import { getBaseUrl, getRequest, parseResponse, parseResponseWithSchema, postRequest } from './utils';

/**
 * Get the DCA orders for a given trader
 * @param params.traderAddress The trader address
 * @param params.status The status of the orders (ACTIVE, CLOSED, INDEXING)
 * @param params.page The page number
 * @param params.size The page size
 * @param params.sort The sort order
 * @param options Optional SDK configuration
 * @returns The page of DCA orders corresponding to the request params
 */
const getDcaOrders = async (
  { traderAddress, status, page, size, sort }: GetDcaOrdersParams,
  options?: AvnuOptions,
): Promise<Page<DcaOrder>> => {
  const params = qs.stringify({ traderAddress, status, page, size, sort }, { arrayFormat: 'repeat' });

  return fetch(`${getBaseUrl(options)}/dca/${DCA_API_VERSION}/orders?${params}`, getRequest(options)).then((response) =>
    parseResponseWithSchema(response, PageSchema(DcaOrderSchema), options?.avnuPublicKey),
  );
};

/**
 * Build the calls to execute a DCA action
 * @param endpoint The endpoint to execute
 * @param body The body of the request
 * @param options Optional SDK configuration
 * @returns The calls to execute
 */
const actionToCalls = async (endpoint: string, body: unknown, options?: AvnuOptions): Promise<AvnuCalls> => {
  return fetch(
    `${getBaseUrl(options)}/dca/${DCA_API_VERSION}/orders${endpoint ? `/${endpoint}` : ''}`,
    postRequest(body, options),
  ).then((response) => parseResponse<AvnuCalls[]>(response, options?.avnuPublicKey));
};

/**
 * Build the calls to execute a "create DCA order" action
 * @param order The DCA order to create
 * @param order.sellTokenAddress The address of the token to sell
 * @param order.buyTokenAddress The address of the token to buy
 * @param order.sellAmount The amount of the token to sell
 * @param order.sellAmountPerCycle The amount of the token to sell per cycle
 * @param order.frequency The frequency of the DCA order
 * @param order.pricingStrategy The pricing strategy to use (tokenToMinAmount and/or tokenToMaxAmount)
 * @param order.traderAddress The address of the trader
 * @param options Optional SDK configuration
 * @returns The calls to execute
 */
const createDcaToCalls = async (order: CreateDcaOrder, options?: AvnuOptions): Promise<AvnuCalls> =>
  actionToCalls('', order, options);

/**
 * Build the calls to execute a "cancel DCA order" action
 * @param orderAddress The address of the DCA contract order to cancel
 * @param options Optional SDK configuration
 * @returns The calls to execute
 */
const cancelDcaToCalls = async (orderAddress: string, options?: AvnuOptions): Promise<AvnuCalls> =>
  actionToCalls(`${orderAddress}/cancel`, undefined, options);

/**
 * Execute a "create DCA order" action
 * @param params.provider The provider to execute the action
 * @param params.paymaster The paymaster to execute the action, if needed
 * @param params.paymaster.active True if the tx must be executed through a paymaster
 * @param params.paymaster.provider The paymaster provider, must implement the PaymasterInterface
 * @param params.paymaster.params The paymaster tx parameters
 * @param params.order The DCA order to create
 * @param params.order.sellTokenAddress The address of the token to sell
 * @param params.order.buyTokenAddress The address of the token to buy
 * @param params.order.sellAmount The amount of the token to sell
 * @param params.order.sellAmountPerCycle The amount of the token to sell per cycle
 * @param params.order.frequency The frequency of the DCA order
 * @param params.order.pricingStrategy The pricing strategy to use (tokenToMinAmount and/or tokenToMaxAmount)
 * @param params.order.traderAddress The address of the trader
 * @param options Optional SDK configuration
 * @returns The transaction hash
 */
const executeCreateDca = async (
  params: InvokeCreateDcaParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, order } = params;
  const { calls } = await createDcaToCalls(order, options);

  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }
console.log('calls', calls);
  const result = await provider.execute(calls);
  return { transactionHash: result.transaction_hash };
};

/**
 * Execute a "cancel DCA order" action
 * @param params.provider The provider to execute the action
 * @param params.paymaster The paymaster to execute the action, if needed
 * @param params.paymaster.active True if the tx must be executed through a paymaster
 * @param params.paymaster.provider The paymaster provider, must implement the PaymasterInterface
 * @param params.paymaster.params The paymaster tx parameters
 * @param params.orderAddress The address of the DCA contract order to cancel
 * @param options Optional SDK configuration
 * @returns The transaction hash
 */
const executeCancelDca = async (
  params: InvokeCancelDcaParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, orderAddress } = params;
  const { calls } = await cancelDcaToCalls(orderAddress, options);

  if (paymaster && paymaster.active) {
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }

  const result = await provider.execute(calls);
  return { transactionHash: result.transaction_hash };
};

export { cancelDcaToCalls, createDcaToCalls, executeCancelDca, executeCreateDca, getDcaOrders };
