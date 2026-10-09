import { executeCalls } from './execute';
import { aAvnuCalls } from './fixtures';
import { createMockAccount, createMockPaymaster, mockExecutionParams } from './test-utils';

describe('executeCalls', () => {
  it('should preserve the existing execute call when execution details are omitted', async () => {
    const account = createMockAccount();
    const { calls } = aAvnuCalls();

    const result = await executeCalls({ provider: account }, calls);

    expect(result).toStrictEqual({ transactionHash: '0xabc' });
    expect(account.execute).toHaveBeenCalledWith(calls);
  });

  it('should forward execution details unchanged', async () => {
    const account = createMockAccount();
    const { calls } = aAvnuCalls();
    const executionDetails = { tip: 1n };

    await executeCalls({ provider: account, executionDetails }, calls);

    expect(account.execute).toHaveBeenCalledWith(calls, executionDetails);
    expect(account.execute.mock.calls[0][1]).toBe(executionDetails);
  });

  it('should forward execution details when the paymaster is inactive', async () => {
    const account = createMockAccount();
    const paymaster = createMockPaymaster();
    const { calls } = aAvnuCalls();
    const executionDetails = { tip: 1n };

    await executeCalls(
      {
        provider: account,
        executionDetails,
        paymaster: { active: false, provider: paymaster, params: mockExecutionParams },
      },
      calls,
    );

    expect(account.execute).toHaveBeenCalledWith(calls, executionDetails);
    expect(paymaster.buildTransaction).not.toHaveBeenCalled();
  });

  it('should reject execution details with an active paymaster', async () => {
    const account = createMockAccount();
    const paymaster = createMockPaymaster();
    const { calls } = aAvnuCalls();

    await expect(
      executeCalls(
        {
          provider: account,
          executionDetails: { tip: 1n },
          paymaster: { active: true, provider: paymaster, params: mockExecutionParams },
        },
        calls,
      ),
    ).rejects.toThrow('executionDetails cannot be used with an active paymaster');
    expect(account.execute).not.toHaveBeenCalled();
    expect(paymaster.buildTransaction).not.toHaveBeenCalled();
  });
});
