import { parseUnits, toBeHex } from 'ethers';
import fetchMock from 'fetch-mock';
import { BASE_URL } from './constants';
import { cancelDcaToCalls, createDcaToCalls, executeCancelDca, executeCreateDca, getDcaOrders } from './dca.services';
import { aCall, aDCACreateOrder, aDCAOrder, aPage } from './fixtures';
import { createMockAccount, createMockPaymaster, mockExecutionParams } from './test-utils';

describe('DCA services', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('getDcaOrders', () => {
    it('should return a list of orders', async () => {
      const order = aDCAOrder();
      // Given
      const response = aPage([
        {
          ...order,
          sellAmount: toBeHex(parseUnits('1', 18)),
          sellAmountPerCycle: toBeHex(parseUnits('1', 18)),
          amountSold: toBeHex(parseUnits('1', 18)),
          amountBought: toBeHex(parseUnits('1', 18)),
          averageAmountBought: toBeHex(parseUnits('1', 18)),
        },
      ]);

      const request = { traderAddress: '0x0' };
      fetchMock.get(`begin:${BASE_URL}/dca/v1/orders?`, response);

      // When
      const result = (await getDcaOrders(request)).content;

      // Then
      const expected = [order];

      expect(result).toStrictEqual(expected);
    });

    it('should throw Error with status code when status > 400', async () => {
      // Given
      const request = { traderAddress: '0x0' };
      fetchMock.get(`begin:${BASE_URL}/dca/v1/orders?`, 401);

      // When
      try {
        await getDcaOrders(request);
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('401 Unauthorized'));
      }
      expect.assertions(1);
    });
  });

  describe('createDcaToCalls', () => {
    it('should return an array of calls', async () => {
      // Given
      const order = aDCACreateOrder();
      const response = [aCall()];
      fetchMock.post(`${BASE_URL}/dca/v1/orders`, response);

      // When
      const result = await createDcaToCalls(order);

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should throw Error with status code when status > 400', async () => {
      // Given
      const order = aDCACreateOrder();
      fetchMock.post(`${BASE_URL}/dca/v1/orders`, {
        status: 400,
        body: { messages: ['Bad Request'] },
      });

      // When & Then
      expect.assertions(1);
      await expect(createDcaToCalls(order)).rejects.toEqual(new Error('Bad Request'));
    });
  });

  describe('cancelDcaToCalls', () => {
    it('should return an array of calls', async () => {
      // Given
      const orderAddress = '0x0order';
      const response = [aCall()];
      fetchMock.post(`${BASE_URL}/dca/v1/orders/${orderAddress}/cancel`, response);

      // When
      const result = await cancelDcaToCalls(orderAddress);

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should throw Error with status code when status > 400', async () => {
      // Given
      const orderAddress = '0x0order';
      fetchMock.post(`${BASE_URL}/dca/v1/orders/${orderAddress}/cancel`, {
        status: 400,
        body: { messages: ['Bad Request'] },
      });

      // When & Then
      expect.assertions(1);
      await expect(cancelDcaToCalls(orderAddress)).rejects.toEqual(new Error('Bad Request'));
    });
  });

  describe('executeCreateDca', () => {
    it('should execute without paymaster', async () => {
      // Given
      const mockAccount = createMockAccount('0x0user');
      const order = aDCACreateOrder();
      const calls = [aCall()];
      fetchMock.post(`${BASE_URL}/dca/v1/orders`, calls);

      // When
      const result = await executeCreateDca({ provider: mockAccount, order });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xabc' });
      expect(mockAccount.execute).toHaveBeenCalledWith(calls);
    });

    it('should execute with paymaster', async () => {
      // Given
      const mockAccount = createMockAccount('0x0user');
      const mockPaymaster = createMockPaymaster();
      const order = aDCACreateOrder();
      const calls = [aCall()];
      fetchMock.post(`${BASE_URL}/dca/v1/orders`, calls);

      // When
      const result = await executeCreateDca({
        provider: mockAccount,
        order,
        paymaster: { active: true, provider: mockPaymaster, params: mockExecutionParams },
      });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xdef' });
      expect(mockPaymaster.buildTransaction).toHaveBeenCalled();
      expect(mockPaymaster.executeTransaction).toHaveBeenCalled();
    });
  });

  describe('executeCancelDca', () => {
    it('should execute without paymaster', async () => {
      // Given
      const mockAccount = createMockAccount('0x0user');
      const orderAddress = '0x0order';
      const calls = [aCall()];
      fetchMock.post(`${BASE_URL}/dca/v1/orders/${orderAddress}/cancel`, calls);

      // When
      const result = await executeCancelDca({ provider: mockAccount, orderAddress });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xabc' });
      expect(mockAccount.execute).toHaveBeenCalledWith(calls);
    });

    it('should execute with paymaster', async () => {
      // Given
      const mockAccount = createMockAccount('0x0user');
      const mockPaymaster = createMockPaymaster();
      const orderAddress = '0x0order';
      const calls = [aCall()];
      fetchMock.post(`${BASE_URL}/dca/v1/orders/${orderAddress}/cancel`, calls);

      // When
      const result = await executeCancelDca({
        provider: mockAccount,
        orderAddress,
        paymaster: { active: true, provider: mockPaymaster, params: mockExecutionParams },
      });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xdef' });
      expect(mockPaymaster.buildTransaction).toHaveBeenCalled();
      expect(mockPaymaster.executeTransaction).toHaveBeenCalled();
    });
  });
});
