import { parseUnits, toBeHex } from 'ethers';
import fetchMock from 'fetch-mock';
import { BASE_URL } from './constants';
import { createDcaToCalls, getDcaOrders } from './dca.services';
import { aDCACreateOrder, anOrderReceipt, aPage } from './fixtures';

describe('DCA services', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('Fetching orders', () => {
    it('should return a list of orders', async () => {
      const order = anOrderReceipt();
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

    describe('createDcaToCalls', () => {
      it('should return an array of calls', async () => {
        // Given
        const order = aDCACreateOrder();
        const response = [
          {
            contractAddress: '0x0',
            calldata: '0x0',
            value: '0x0',
          },
        ];
        fetchMock.post(`begin:${BASE_URL}/dca/v1/orders`, response);

        // When
        const result = await createDcaToCalls(order);

        // Then
        expect(result).toStrictEqual(response);
      });
    });
  });
});
