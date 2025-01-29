import fetchMock from 'fetch-mock';
import { BASE_URL } from './constants';
import { fetchBuildCreateOrderTypedData, fetchCreateOrder, fetchGetOrders } from './dca.services';
import { aDCACreateOrder, anOrderReceipt, aPage, aPrice } from './fixtures';

import { parseUnits, toBeHex } from 'ethers';
import { TypedData } from 'starknet';

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

    describe('fetchCreateOrder', () => {
      it('should return an array of calls', async () => {
        // Given
        const createOrder = aDCACreateOrder();
        const response = [
            {
                contractAddress: '0x0',
                calldata: '0x0',
                value: '0x0',
            }
        ];
        fetchMock.post(`begin:${BASE_URL}/dca/v1/orders`, response);

        // When
        const result = await fetchCreateOrder(createOrder);

        // Then
        expect(result).toStrictEqual(response);
      });
    });

    describe('fetchBuildCreateOrderTypedData', () => {
        it('should return an array of calls', async () => {
          // Given
          const createOrder = aDCACreateOrder();
          const response: TypedData = {
              domain: {
                name: 'Starknet DCA',
                version: '1',
                chainId: '1',
              },
              types: {},
              primaryType: 'CreateOrder',
              message: {},
          };
          fetchMock.post(`begin:${BASE_URL}/dca/v1/orders`, response);
  
          // When
          const result = await fetchBuildCreateOrderTypedData(createOrder, undefined, undefined);
          
          // Then
          expect(result).toStrictEqual(response);
        });
      });
  });
});
