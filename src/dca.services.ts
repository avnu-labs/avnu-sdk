import { toBeHex } from 'ethers';
import qs from 'qs';
import { AccountInterface, Call, Signature, TypedData } from 'starknet';
import {
  AvnuOptions,
  CreateOrderDto,
  EstimatedGasFees,
  GetOrdersParams,
  InvokeTransactionResponse,
  OrderReceipt,
  Page,
  PaymasterOptions,
} from './types';
import { getBaseUrl, getRequest, parseResponse, postRequest } from './utils';

const fetchBuildCalls = async (url: string, body: unknown, options?: AvnuOptions): Promise<Call[]> => {
  return fetch(`${getBaseUrl(options)}/dca/v1/${url}`, postRequest(body, options)).then((response) =>
    parseResponse<Call[]>(response, options?.avnuPublicKey),
  );
};

const fetchEstimateFee = async (url: string, body: unknown, options?: AvnuOptions): Promise<EstimatedGasFees> => {
  return fetch(`${getBaseUrl(options)}/dca/v1/${url}`, postRequest(body, options))
    .then((response) => parseResponse<EstimatedGasFees>(response, options?.avnuPublicKey))
    .then((response) => ({
      ...response,
      overallFee: BigInt(response.overallFee),
      paymaster: {
        ...response.paymaster,
        gasTokenPrices: response.paymaster.gasTokenPrices.map((price) => ({
          ...price,
          gasFeesInGasToken: BigInt(price.gasFeesInGasToken),
        })),
      },
    }));
};

const fetchBuildTypedData = async (
  url: string,
  body: object,
  gasTokenAddress: string | undefined,
  maxGasTokenAmount: bigint | undefined,
  options?: AvnuOptions,
): Promise<TypedData> => {
  return fetch(
    `${getBaseUrl(options)}/dca/v1/${url}`,
    postRequest(
      {
        ...body,
        gasTokenAddress,
        ...(maxGasTokenAmount !== undefined && { maxGasTokenAmount: toBeHex(maxGasTokenAmount) }),
      },
      options,
    ),
  ).then((response) => parseResponse<TypedData>(response, options?.avnuPublicKey));
};

const fetchExecute = async (
  url: string,
  userAddress: string,
  typedData: string,
  signature: Signature,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  if (Array.isArray(signature)) {
    // eslint-disable-next-line no-param-reassign
    signature = signature.map((sig) => toBeHex(BigInt(sig)));
  } else if (signature.r && signature.s) {
    // eslint-disable-next-line no-param-reassign
    signature = [toBeHex(BigInt(signature.r)), toBeHex(BigInt(signature.s))];
  }
  return fetch(
    `${getBaseUrl(options)}/dca/v1/${url}`,
    postRequest({ userAddress, typedData, signature }, options),
  ).then((response) => parseResponse<InvokeTransactionResponse>(response, options?.avnuPublicKey));
};

const executeDca = async (
  account: AccountInterface,
  buildCalls: () => Promise<Call[]>,
  buildTypedData: () => Promise<TypedData>,
  executeTypedData: (typedData: string, signature: Signature) => Promise<InvokeTransactionResponse>,
  { gasless = false, gasfree = false, gasTokenAddress, maxGasTokenAmount, executeGaslessTxCallback }: PaymasterOptions,
): Promise<InvokeTransactionResponse> => {
  if (gasless || gasfree) {
    // gasTokenAddress and maxGasTokenAmount are not required for gasfree
    if (!gasfree && (!gasTokenAddress || !maxGasTokenAmount)) {
      throw Error(`Should provide gasTokenAddress and maxGasTokenAmount when gasless is true`);
    }
    const typedData = await buildTypedData();
    const signature = await account.signMessage(typedData);
    if (executeGaslessTxCallback) {
      executeGaslessTxCallback();
    }
    return executeTypedData(JSON.stringify(typedData), signature);
  }
  return buildCalls()
    .then((calls) => account.execute(calls))
    .then((value) => ({ transactionHash: value.transaction_hash }));
};

const fetchCreateOrder = async (order: CreateOrderDto, options?: AvnuOptions): Promise<Call[]> =>
  fetchBuildCalls('orders', order, options);

const fetchEstimateFeeCreateOrder = async (
  order: CreateOrderDto,
  traderAddress: string,
  options?: AvnuOptions,
): Promise<EstimatedGasFees> => {
  return fetchEstimateFee('orders/estimate-fee', order, options);
};

const fetchBuildCreateOrderTypedData = async (
  order: CreateOrderDto,
  gasTokenAddress: string | undefined,
  maxGasTokenAmount: bigint | undefined,
  options?: AvnuOptions,
): Promise<TypedData> =>
  fetchBuildTypedData('orders/build-typed-data', order, gasTokenAddress, maxGasTokenAmount, options);

const fetchExecuteCreateOrder = async (
  userAddress: string,
  typedData: string,
  signature: Signature,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => fetchExecute('orders/execute', userAddress, typedData, signature, options);

const fetchCancelOrder = async (orderAddress: string, options?: AvnuOptions): Promise<Call[]> =>
  fetchBuildCalls(`orders/${orderAddress}/cancel`, undefined, options);

const fetchEstimateFeeCancelOrder = async (
  orderAddress: string,
  userAddress: string,
  options?: AvnuOptions,
): Promise<EstimatedGasFees> =>
  fetchEstimateFee(`orders/${orderAddress}/cancel/estimate-fee`, { traderAddress: userAddress }, options);

const fetchBuildCancelOrderTypedData = async (
  orderAddress: string,
  userAddress: string,
  gasTokenAddress: string | undefined,
  maxGasTokenAmount: bigint | undefined,
  options?: AvnuOptions,
): Promise<TypedData> =>
  fetchBuildTypedData(
    `orders/${orderAddress}/cancel/build-typed-data`,
    { traderAddress: userAddress },
    gasTokenAddress,
    maxGasTokenAmount,
    options,
  );

const fetchExecuteCancelOrder = async (
  userAddress: string,
  orderAddress: string,
  typedData: string,
  signature: Signature,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> =>
  fetchExecute(`orders/${orderAddress}/cancel/execute`, userAddress, typedData, signature, options);

const fetchGetOrders = async (
  { traderAddress, status, page, size, sort }: GetOrdersParams,
  options?: AvnuOptions,
): Promise<Page<OrderReceipt>> => {
  const params = qs.stringify({ traderAddress, status, page, size, sort }, { arrayFormat: 'repeat' });

  return fetch(`${getBaseUrl(options)}/dca/v1/orders?${params}`, getRequest(options))
    .then((response) => parseResponse<Page<OrderReceipt>>(response, options?.avnuPublicKey))
    .then((result) => ({
      ...result,
      content: result.content.map((order) => ({
        ...order,
        sellAmount: BigInt(order.sellAmount),
        sellAmountPerCycle: BigInt(order.sellAmountPerCycle),
        amountSold: BigInt(order.amountSold),
        amountBought: BigInt(order.amountBought),
        averageAmountBought: BigInt(order.averageAmountBought),
        trades: order.trades.map((trade) => ({
          ...trade,
          sellAmount: BigInt(trade.sellAmount),
          buyAmount: trade.buyAmount && BigInt(trade.buyAmount),
        })),
      })),
    }));
};

const executeCreateOrder = async (
  account: AccountInterface,
  order: CreateOrderDto,
  { gasless = false, gasfree = false, gasTokenAddress, maxGasTokenAmount, executeGaslessTxCallback }: PaymasterOptions,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  return executeDca(
    account,
    () => fetchCreateOrder(order, options),
    () => fetchBuildCreateOrderTypedData(order, gasTokenAddress, maxGasTokenAmount, options),
    (typedData, signature) => fetchExecuteCreateOrder(account.address, typedData, signature, options),
    { gasless, gasfree, gasTokenAddress, maxGasTokenAmount, executeGaslessTxCallback },
  );
};

const executeCancelOrder = async (
  account: AccountInterface,
  orderAddress: string,
  { gasless = false, gasfree = false, gasTokenAddress, maxGasTokenAmount, executeGaslessTxCallback }: PaymasterOptions,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> =>
  executeDca(
    account,
    () => fetchCancelOrder(orderAddress, options),
    () => fetchBuildCancelOrderTypedData(orderAddress, account.address, gasTokenAddress, maxGasTokenAmount, options),
    (typedData, signature) => fetchExecuteCancelOrder(account.address, orderAddress, typedData, signature, options),
    { gasless, gasfree, gasTokenAddress, maxGasTokenAmount, executeGaslessTxCallback },
  );

export {
  executeCancelOrder,
  executeCreateOrder,
  fetchBuildCancelOrderTypedData,
  fetchBuildCreateOrderTypedData,
  fetchCancelOrder,
  fetchCreateOrder,
  fetchEstimateFeeCancelOrder,
  fetchEstimateFeeCreateOrder,
  fetchExecuteCancelOrder,
  fetchExecuteCreateOrder,
  fetchGetOrders,
};
