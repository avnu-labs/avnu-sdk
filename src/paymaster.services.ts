import { toBeHex } from 'ethers';
import { AccountInterface, Call, PreparedInvokeTransaction } from 'starknet';
import {
  BuildPaymasterTransactionParams,
  ExecutePaymasterTransactionParams,
  InvokePaymasterParams,
  InvokeTransactionResponse,
  SignedPaymasterTransaction,
  SignTransactionParams,
} from './types';

/**
 * Build a paymaster transaction
 * !! Be careful if you run this on a client it will leak your PAYMASTER_API_KEY if you have one!!
 * !! Use it in a server-side environment instead !!
 *
 * @param params The paymaster transaction parameters
 * @param params.takerAddress The address of the taker who will execute the transaction
 * @param params.paymaster The paymaster params
 * @param params.calls The calls to execute
 * @returns The prepared paymaster transaction containing the typed data to sign
 */
const buildPaymasterTransaction = async (
  params: BuildPaymasterTransactionParams,
): Promise<PreparedInvokeTransaction> => {
  const { takerAddress, paymaster, calls } = params;
  return paymaster.provider.buildTransaction(
    { type: 'invoke', invoke: { userAddress: takerAddress, calls } },
    paymaster.params,
  ) as Promise<PreparedInvokeTransaction>;
};

/**
 * Sign the paymaster transaction
 *
 * @param params The signature parameters
 * @param params.provider The account which will sign the transaction, must implement the AccountInterface
 * @param params.typedData The typed data to sign
 * @returns The prepared paymaster transaction containing the typed data and the signature
 */
const signPaymasterTransaction = async (params: SignTransactionParams): Promise<SignedPaymasterTransaction> => {
  const { provider, typedData } = params;
  const rawSignature = await provider.signMessage(typedData);
  let signature: string[] = [];
  if (Array.isArray(rawSignature)) {
    signature = rawSignature.map((sig) => toBeHex(BigInt(sig)));
  } else if (rawSignature.r && rawSignature.s) {
    signature = [toBeHex(BigInt(rawSignature.r)), toBeHex(BigInt(rawSignature.s))];
  }
  return {
    typedData,
    signature,
  };
};

/**
 * Execute a paymaster transaction
 * !! Be careful if you run this on a client it will leak your PAYMASTER_API_KEY if you have one!!
 * !! Use it in a server-side environment instead !!
 *
 * @param params The execution parameters
 * @param params.takerAddress The address of the taker who will execute the transaction
 * @param params.paymaster The paymaster params
 * @param params.signedTransaction The signed transaction with typed data and signature
 * @returns The transaction hash
 */
const executePaymasterTransaction = async (
  params: ExecutePaymasterTransactionParams,
): Promise<InvokeTransactionResponse> => {
  const { takerAddress, paymaster, signedTransaction } = params;
  const { provider, params: executionParams } = paymaster;
  const { typedData, signature } = signedTransaction;
  return provider
    .executeTransaction(
      {
        type: 'invoke',
        invoke: { userAddress: takerAddress, typedData, signature },
      },
      executionParams,
    )
    .then((result) => ({ transactionHash: result.transaction_hash }));
};

/**
 * Execute the complete paymaster flow
 * !! Be careful if you run this on a client it will leak your PAYMASTER_API_KEY if you have one!!
 * !! Use it in a server-side environment instead !!
 *
 * @param paymaster.provider The paymaster provider, must implement the PaymasterInterface
 * @param paymaster.params The paymaster parameters
 * @param provider The account which will execute the transaction, must implement the AccountInterface
 * @param calls The calls to execute
 * @returns The transaction hash
 */
const executeAllPaymasterFlow = async ({
  paymaster,
  provider,
  calls,
}: {
  paymaster: InvokePaymasterParams;
  provider: AccountInterface;
  calls: Call[];
}): Promise<InvokeTransactionResponse> => {
  const prepared = await buildPaymasterTransaction({
    takerAddress: provider.address,
    paymaster,
    calls,
  });
  const signed = await signPaymasterTransaction({
    provider,
    typedData: prepared.typed_data,
  });
  return executePaymasterTransaction({
    takerAddress: provider.address,
    paymaster,
    signedTransaction: signed,
  });
};

export { buildPaymasterTransaction, executeAllPaymasterFlow, executePaymasterTransaction, signPaymasterTransaction };
