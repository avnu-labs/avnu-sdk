import fetchMock from 'fetch-mock';
import { BASE_URL } from './constants';
import { fetchGetOrders } from './dca.services';
import { anOrderReceipt, aPage, aPrice } from './fixtures';
import { OrderReceipt } from './types';
import qs from 'qs';
import { parseUnits, toBeHex } from 'ethers';

const serializeBigInts = (obj: any): any => {
    if (typeof obj === 'bigint') {
      return obj.toString();
    }
    if (Array.isArray(obj)) {
      return obj.map(serializeBigInts);
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, serializeBigInts(value)])
      );
    }
    return obj;
  };

describe('DCA services', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('Fetching orders', () => {
    it('should return a list of orders', async () => {
        const order = anOrderReceipt();
      // Given
      const response = aPage([{
        ...order,
        sellAmount: toBeHex(parseUnits('1', 18)),
        sellAmountPerCycle: toBeHex(parseUnits('1', 18)),
        amountSold: toBeHex(parseUnits('1', 18)),
        amountBought: toBeHex(parseUnits('1', 18)),
        averageAmountBought: toBeHex(parseUnits('1', 18)),
      }]);

      const request = { traderAddress: '0x0' };
      fetchMock.get(`begin:${BASE_URL}/dca/v1/orders?`, response);

      // When
      const result = (await fetchGetOrders(request)).content;

      // Then
      const expected = [{ 
        ...order, 
        timestamp: order.timestamp?.toISOString(), 
        closeDate: order.closeDate?.toISOString(), 
        startDate: order.startDate?.toISOString(), 
        endDate: order.endDate?.toISOString() 
    }];

      expect(result).toStrictEqual(expected);
    });

    describe('executeCreateOrder', () => {
      it('should return a list of prices', async () => {
        // Given
      });
    });
  });
});
