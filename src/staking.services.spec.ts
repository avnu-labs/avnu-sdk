import { parseUnits, toBeHex } from 'ethers';
import fetchMock from 'fetch-mock';
import { BASE_URL } from './constants';
import { aCall, aDelegationPool, aStakingInfo, aUserStakingInfo } from './fixtures';
import {
  claimRewardsToCalls,
  executeClaimRewards,
  executeInitiateUnstake,
  executeStake,
  executeUnstake,
  getAvnuStakingInfo,
  getUserStakingInfo,
  initiateUnstakeToCalls,
  stakeToCalls,
  unstakeToCalls,
} from './staking.services';
import { createMockAccount, createMockPaymaster, mockExecutionParams } from './test-utils';

describe('Staking services', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('getAvnuStakingInfo', () => {
    it('should return staking info', async () => {
      // Given
      const response = {
        ...aStakingInfo(),
        selfStakedAmount: toBeHex(parseUnits('1000', 18)),
        delegationPools: [
          {
            ...aDelegationPool(),
            stakedAmount: toBeHex(parseUnits('500', 18)),
          },
        ],
      };
      fetchMock.get(`${BASE_URL}/staking/v2/info`, response);

      // When
      const result = await getAvnuStakingInfo();

      // Then
      expect(result).toStrictEqual(aStakingInfo());
    });

    it('should throw Error with status code when status > 400', async () => {
      // Given
      fetchMock.get(`${BASE_URL}/staking/v2/info`, 401);

      // When
      try {
        await getAvnuStakingInfo();
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('401 Unauthorized'));
      }
      expect.assertions(1);
    });

    it('should use baseUrl from AvnuOptions when defined', async () => {
      // Given
      const baseUrl = 'https://example.com';
      const response = {
        ...aStakingInfo(),
        selfStakedAmount: toBeHex(parseUnits('1000', 18)),
        delegationPools: [
          {
            ...aDelegationPool(),
            stakedAmount: toBeHex(parseUnits('500', 18)),
          },
        ],
      };
      fetchMock.get(`${baseUrl}/staking/v2/info`, response);

      // When
      const result = await getAvnuStakingInfo({ baseUrl });

      // Then
      expect(result).toStrictEqual(aStakingInfo());
    });
  });

  describe('getUserStakingInfo', () => {
    it('should return user staking info', async () => {
      // Given
      const tokenAddress = '0x0token';
      const userAddress = '0x0user';
      const response = {
        ...aUserStakingInfo(),
        amount: toBeHex(parseUnits('100', 18)),
        unclaimedRewards: toBeHex(parseUnits('10', 18)),
        unpoolAmount: '0x0',
        unpoolTime: null,
        totalClaimedRewards: toBeHex(parseUnits('5', 18)),
        expectedYearlyStrkRewards: toBeHex(parseUnits('50', 18)),
        aprs: [{ date: '2024-01-01', apr: 5.5 }],
      };
      fetchMock.get(`${BASE_URL}/staking/v2/pools/${tokenAddress}/members/${userAddress}`, response);

      // When
      const result = await getUserStakingInfo(tokenAddress, userAddress);

      // Then
      expect(result).toStrictEqual(aUserStakingInfo());
    });

    it('should throw Error with status code when status > 400', async () => {
      // Given
      const tokenAddress = '0x0token';
      const userAddress = '0x0user';
      fetchMock.get(`${BASE_URL}/staking/v2/pools/${tokenAddress}/members/${userAddress}`, 404);

      // When
      try {
        await getUserStakingInfo(tokenAddress, userAddress);
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('404 Not Found'));
      }
      expect.assertions(1);
    });
  });

  describe('stakeToCalls', () => {
    it('should return array of calls', async () => {
      // Given
      const poolAddress = '0x0pool';
      const userAddress = '0x0user';
      const amount = parseUnits('100', 18);
      const response = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/${userAddress}/stake`, response);

      // When
      const result = await stakeToCalls({ poolAddress, userAddress, amount });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should throw Error with status code when status > 400', async () => {
      // Given
      const poolAddress = '0x0pool';
      const userAddress = '0x0user';
      const amount = parseUnits('100', 18);
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/${userAddress}/stake`, {
        status: 400,
        body: { messages: ['Bad Request'] },
      });

      // When & Then
      expect.assertions(1);
      await expect(stakeToCalls({ poolAddress, userAddress, amount })).rejects.toEqual(new Error('Bad Request'));
    });
  });

  describe('initiateUnstakeToCalls', () => {
    it('should return array of calls', async () => {
      // Given
      const poolAddress = '0x0pool';
      const userAddress = '0x0user';
      const amount = parseUnits('100', 18);
      const response = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/${userAddress}/initiate-withdraw`, response);

      // When
      const result = await initiateUnstakeToCalls({ poolAddress, userAddress, amount });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should throw Error with status code when status > 400', async () => {
      // Given
      const poolAddress = '0x0pool';
      const userAddress = '0x0user';
      const amount = parseUnits('100', 18);
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/${userAddress}/initiate-withdraw`, {
        status: 400,
        body: { messages: ['Bad Request'] },
      });

      // When & Then
      expect.assertions(1);
      await expect(initiateUnstakeToCalls({ poolAddress, userAddress, amount })).rejects.toEqual(
        new Error('Bad Request'),
      );
    });
  });

  describe('unstakeToCalls', () => {
    it('should return array of calls', async () => {
      // Given
      const poolAddress = '0x0pool';
      const userAddress = '0x0user';
      const response = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/${userAddress}/claim-withdraw`, response);

      // When
      const result = await unstakeToCalls({ poolAddress, userAddress });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should throw Error with status code when status > 400', async () => {
      // Given
      const poolAddress = '0x0pool';
      const userAddress = '0x0user';
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/${userAddress}/claim-withdraw`, {
        status: 400,
        body: { messages: ['Bad Request'] },
      });

      // When & Then
      expect.assertions(1);
      await expect(unstakeToCalls({ poolAddress, userAddress })).rejects.toEqual(new Error('Bad Request'));
    });
  });

  describe('claimRewardsToCalls', () => {
    it('should return array of calls with restake=true', async () => {
      // Given
      const poolAddress = '0x0pool';
      const userAddress = '0x0user';
      const restake = true;
      const response = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/${userAddress}/claim-rewards`, response);

      // When
      const result = await claimRewardsToCalls({ poolAddress, userAddress, restake });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should return array of calls with restake=false', async () => {
      // Given
      const poolAddress = '0x0pool';
      const userAddress = '0x0user';
      const restake = false;
      const response = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/${userAddress}/claim-rewards`, response);

      // When
      const result = await claimRewardsToCalls({ poolAddress, userAddress, restake });

      // Then
      expect(result).toStrictEqual(response);
    });
  });

  describe('executeStake', () => {
    it('should execute without paymaster', async () => {
      // Given
      const mockAccount = createMockAccount('0x0user');
      const poolAddress = '0x0pool';
      const amount = parseUnits('100', 18);
      const calls = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/0x0user/stake`, calls);

      // When
      const result = await executeStake({ provider: mockAccount, poolAddress, amount });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xabc' });
      expect(mockAccount.execute).toHaveBeenCalledWith(calls);
    });

    it('should execute with paymaster', async () => {
      // Given
      const mockAccount = createMockAccount('0x0user');
      const mockPaymaster = createMockPaymaster();
      const poolAddress = '0x0pool';
      const amount = parseUnits('100', 18);
      const calls = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/0x0user/stake`, calls);

      // When
      const result = await executeStake({
        provider: mockAccount,
        poolAddress,
        amount,
        paymaster: { active: true, provider: mockPaymaster, params: mockExecutionParams },
      });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xdef' });
      expect(mockPaymaster.buildTransaction).toHaveBeenCalled();
      expect(mockPaymaster.executeTransaction).toHaveBeenCalled();
    });
  });

  describe('executeInitiateUnstake', () => {
    it('should execute without paymaster', async () => {
      // Given
      const mockAccount = createMockAccount('0x0user');
      const poolAddress = '0x0pool';
      const amount = parseUnits('100', 18);
      const calls = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/0x0user/initiate-withdraw`, calls);

      // When
      const result = await executeInitiateUnstake({ provider: mockAccount, poolAddress, amount });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xabc' });
      expect(mockAccount.execute).toHaveBeenCalledWith(calls);
    });

    it('should execute with paymaster', async () => {
      // Given
      const mockAccount = createMockAccount('0x0user');
      const mockPaymaster = createMockPaymaster();
      const poolAddress = '0x0pool';
      const amount = parseUnits('100', 18);
      const calls = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/0x0user/initiate-withdraw`, calls);

      // When
      const result = await executeInitiateUnstake({
        provider: mockAccount,
        poolAddress,
        amount,
        paymaster: { active: true, provider: mockPaymaster, params: mockExecutionParams },
      });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xdef' });
      expect(mockPaymaster.buildTransaction).toHaveBeenCalled();
      expect(mockPaymaster.executeTransaction).toHaveBeenCalled();
    });
  });

  describe('executeUnstake', () => {
    it('should execute without paymaster', async () => {
      // Given
      const mockAccount = createMockAccount('0x0user');
      const poolAddress = '0x0pool';
      const calls = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/0x0user/claim-withdraw`, calls);

      // When
      const result = await executeUnstake({ provider: mockAccount, poolAddress });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xabc' });
      expect(mockAccount.execute).toHaveBeenCalledWith(calls);
    });

    it('should execute with paymaster', async () => {
      // Given
      const mockAccount = createMockAccount('0x0user');
      const mockPaymaster = createMockPaymaster();
      const poolAddress = '0x0pool';
      const calls = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/0x0user/claim-withdraw`, calls);

      // When
      const result = await executeUnstake({
        provider: mockAccount,
        poolAddress,
        paymaster: { active: true, provider: mockPaymaster, params: mockExecutionParams },
      });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xdef' });
      expect(mockPaymaster.buildTransaction).toHaveBeenCalled();
      expect(mockPaymaster.executeTransaction).toHaveBeenCalled();
    });
  });

  describe('executeClaimRewards', () => {
    it('should execute without paymaster', async () => {
      // Given
      const mockAccount = createMockAccount('0x0user');
      const poolAddress = '0x0pool';
      const restake = true;
      const calls = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/0x0user/claim-rewards`, calls);

      // When
      const result = await executeClaimRewards({ provider: mockAccount, poolAddress, restake });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xabc' });
      expect(mockAccount.execute).toHaveBeenCalledWith(calls);
    });

    it('should execute with paymaster', async () => {
      // Given
      const mockAccount = createMockAccount('0x0user');
      const mockPaymaster = createMockPaymaster();
      const poolAddress = '0x0pool';
      const restake = false;
      const calls = [aCall()];
      fetchMock.post(`${BASE_URL}/staking/v2/pools/${poolAddress}/members/0x0user/claim-rewards`, calls);

      // When
      const result = await executeClaimRewards({
        provider: mockAccount,
        poolAddress,
        restake,
        paymaster: { active: true, provider: mockPaymaster, params: mockExecutionParams },
      });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xdef' });
      expect(mockPaymaster.buildTransaction).toHaveBeenCalled();
      expect(mockPaymaster.executeTransaction).toHaveBeenCalled();
    });
  });
});
