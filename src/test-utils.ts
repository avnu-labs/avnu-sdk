import { OutsideExecutionTypedData } from '@starknet-io/starknet-types-09';
import { AccountInterface, ExecutionParameters, PaymasterInterface } from 'starknet';

// Mock ExecutionParameters (using type assertion since we only need it for mocking)
export const mockExecutionParams = {
  version: '0x1',
  feeMode: { mode: 'default', gasToken: '0x0' },
} as ExecutionParameters;

// Mock AccountInterface factory
export const createMockAccount = (address = '0x123'): jest.Mocked<AccountInterface> =>
  ({
    address,
    execute: jest.fn().mockResolvedValue({ transaction_hash: '0xabc' }),
    signMessage: jest.fn().mockResolvedValue(['0x1', '0x2']),
  }) as unknown as jest.Mocked<AccountInterface>;

// Mock PaymasterInterface factory
export const createMockPaymaster = (): jest.Mocked<PaymasterInterface> =>
  ({
    buildTransaction: jest.fn().mockResolvedValue({
      typed_data: {
        domain: { name: 'test', version: '1', chainId: '0x1' },
        message: {},
        types: {},
        primaryType: 'test',
      } as OutsideExecutionTypedData,
    }),
    executeTransaction: jest.fn().mockResolvedValue({ transaction_hash: '0xdef' }),
  }) as unknown as jest.Mocked<PaymasterInterface>;
