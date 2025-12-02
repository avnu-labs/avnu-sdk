import { AccountInterface, PaymasterInterface, PreparedInvokeTransaction } from 'starknet';
import { aCall, aPreparedTypedData } from './fixtures';
import {
  buildPaymasterTransaction,
  executeAllPaymasterFlow,
  executePaymasterTransaction,
  signPaymasterTransaction,
} from './paymaster.services';
import { mockExecutionParams } from './test-utils';

describe('Paymaster services', () => {
  describe('buildPaymasterTransaction', () => {
    it('should call paymaster.provider.buildTransaction', async () => {
      // Given
      const takerAddress = '0x0user';
      const calls = [aCall()];
      const typedData = aPreparedTypedData();
      const mockPaymaster: jest.Mocked<PaymasterInterface> = {
        buildTransaction: jest.fn().mockResolvedValue({ typed_data: typedData }),
        executeTransaction: jest.fn(),
      } as unknown as jest.Mocked<PaymasterInterface>;
      const params = mockExecutionParams;

      // When
      const result = await buildPaymasterTransaction({
        takerAddress,
        paymaster: { provider: mockPaymaster, params },
        calls,
      });

      // Then
      expect(mockPaymaster.buildTransaction).toHaveBeenCalledWith(
        { type: 'invoke', invoke: { userAddress: takerAddress, calls } },
        params,
      );
      expect(result).toStrictEqual({ typed_data: typedData } as PreparedInvokeTransaction);
    });
  });

  describe('signPaymasterTransaction', () => {
    it('should handle array signature format', async () => {
      // Given
      const typedData = aPreparedTypedData();
      const mockAccount: jest.Mocked<AccountInterface> = {
        address: '0x0user',
        signMessage: jest.fn().mockResolvedValue(['0x1', '0x2']),
      } as unknown as jest.Mocked<AccountInterface>;

      // When
      const result = await signPaymasterTransaction({
        provider: mockAccount,
        typedData,
      });

      // Then
      expect(mockAccount.signMessage).toHaveBeenCalledWith(typedData);
      expect(result).toStrictEqual({
        typedData,
        signature: ['0x01', '0x02'],
      });
    });

    it('should handle object signature with r and s', async () => {
      // Given
      const typedData = aPreparedTypedData();
      const mockAccount: jest.Mocked<AccountInterface> = {
        address: '0x0user',
        signMessage: jest.fn().mockResolvedValue({ r: '0x1', s: '0x2' }),
      } as unknown as jest.Mocked<AccountInterface>;

      // When
      const result = await signPaymasterTransaction({
        provider: mockAccount,
        typedData,
      });

      // Then
      expect(mockAccount.signMessage).toHaveBeenCalledWith(typedData);
      expect(result).toStrictEqual({
        typedData,
        signature: ['0x01', '0x02'],
      });
    });
  });

  describe('executePaymasterTransaction', () => {
    it('should execute and return transaction hash', async () => {
      // Given
      const takerAddress = '0x0user';
      const typedData = aPreparedTypedData();
      const signature = ['0x1', '0x2'];
      const mockPaymaster: jest.Mocked<PaymasterInterface> = {
        buildTransaction: jest.fn(),
        executeTransaction: jest.fn().mockResolvedValue({ transaction_hash: '0xdef' }),
      } as unknown as jest.Mocked<PaymasterInterface>;
      const params = mockExecutionParams;

      // When
      const result = await executePaymasterTransaction({
        takerAddress,
        paymaster: { provider: mockPaymaster, params },
        signedTransaction: { typedData, signature },
      });

      // Then
      expect(mockPaymaster.executeTransaction).toHaveBeenCalledWith(
        { type: 'invoke', invoke: { userAddress: takerAddress, typedData, signature } },
        params,
      );
      expect(result).toStrictEqual({ transactionHash: '0xdef' });
    });
  });

  describe('executeAllPaymasterFlow', () => {
    it('should chain build -> sign -> execute', async () => {
      // Given
      const calls = [aCall()];
      const typedData = aPreparedTypedData();
      const mockAccount: jest.Mocked<AccountInterface> = {
        address: '0x0user',
        signMessage: jest.fn().mockResolvedValue(['0x1', '0x2']),
        execute: jest.fn(),
      } as unknown as jest.Mocked<AccountInterface>;
      const mockPaymaster: jest.Mocked<PaymasterInterface> = {
        buildTransaction: jest.fn().mockResolvedValue({
          typed_data: typedData,
        } as PreparedInvokeTransaction),
        executeTransaction: jest.fn().mockResolvedValue({ transaction_hash: '0xfinal' }),
      } as unknown as jest.Mocked<PaymasterInterface>;
      const params = mockExecutionParams;

      // When
      const result = await executeAllPaymasterFlow({
        paymaster: { active: true, provider: mockPaymaster, params },
        provider: mockAccount,
        calls,
      });

      // Then
      // Verify build was called
      expect(mockPaymaster.buildTransaction).toHaveBeenCalledWith(
        { type: 'invoke', invoke: { userAddress: '0x0user', calls } },
        params,
      );
      // Verify sign was called
      expect(mockAccount.signMessage).toHaveBeenCalledWith(typedData);
      // Verify execute was called
      expect(mockPaymaster.executeTransaction).toHaveBeenCalledWith(
        {
          type: 'invoke',
          invoke: {
            userAddress: '0x0user',
            typedData,
            signature: ['0x01', '0x02'],
          },
        },
        params,
      );
      // Verify result
      expect(result).toStrictEqual({ transactionHash: '0xfinal' });
    });

    it('should propagate errors from build step', async () => {
      // Given
      const calls = [aCall()];
      const mockAccount: jest.Mocked<AccountInterface> = {
        address: '0x0user',
        signMessage: jest.fn(),
        execute: jest.fn(),
      } as unknown as jest.Mocked<AccountInterface>;
      const mockPaymaster: jest.Mocked<PaymasterInterface> = {
        buildTransaction: jest.fn().mockRejectedValue(new Error('Build failed')),
        executeTransaction: jest.fn(),
      } as unknown as jest.Mocked<PaymasterInterface>;
      const params = mockExecutionParams;

      // When & Then
      await expect(
        executeAllPaymasterFlow({
          paymaster: { active: true, provider: mockPaymaster, params },
          provider: mockAccount,
          calls,
        }),
      ).rejects.toEqual(new Error('Build failed'));
    });
  });
});
