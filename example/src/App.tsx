import React, { ChangeEvent, useState } from 'react';
import type { AccountInterface } from "starknet";
import { connect } from "get-starknet";
import { executeSwap, fetchBuildExecuteTransaction, fetchQuotes, Quote } from "@avnu/avnu-sdk";
import { formatUnits, parseUnits } from 'ethers';

const AVNU_OPTIONS = { baseUrl: 'https://starknet.api.avnu.fi' };

const ethAddress = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
const usdcAddress = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8"
const strkAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"

function App() {
  const [ account, setAccount ] = useState<AccountInterface>()
  const [ sellAmount, setSellAmount ] = useState<string>()
  const [ quotes, setQuotes ] = useState<Quote[]>([])
  const [ loading, setLoading ] = useState<boolean>(false)
  const [ errorMessage, setErrorMessage ] = useState<string>()
  const [ successMessage, setSuccessMessage ] = useState<string>()

  const handleConnect = async () => {
    const starknet = await connect();
    if (!starknet) return;
    await starknet.enable();
    if (starknet.isConnected && starknet.provider && starknet.account.address) {
      setAccount(starknet.account)
    }
  }

  const handleChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (!account) return;
    setErrorMessage('')
    setQuotes([])
    setSellAmount(event.target.value);
    setLoading(true)
  }

  const handleQuickBuy = async () => {
    console.log('Quick Buy Amount:', sellAmount);
    if (!account || !sellAmount ) {
      setErrorMessage("Please connect wallet and enter a valid amount.");
      return;
    }
    console.log('account', account);
    setLoading(true);

    try {
      // Fetch quotes before executing swap
      const params = {
        sellTokenAddress: strkAddress,
        buyTokenAddress: usdcAddress,
        sellAmount: parseUnits(sellAmount, 18),
        takerAddress: account.address,
        size: 3,
      };
      const quotes = await fetchQuotes(params, AVNU_OPTIONS);

      console.log('quotes', quotes);
      const params2 = {
        quoteId: quotes[0].quoteId,
        takerAddress: account.address,
        slippage: 0.01,
        includeApprove: true
      };
      console.log('params2', params2);
      const build = await fetchBuildExecuteTransaction(quotes[0].quoteId, account.address, 0.01, true );

      console.log('build', build);

      if (!quotes.length) {
        setErrorMessage("No quotes available for this amount.");
        setLoading(false);
        return;
      }

      // Execute swap with the first quote
      await executeSwap(account, quotes[0], {}, AVNU_OPTIONS);

      setSuccessMessage("Swap successful!");
      setSellAmount("");
    } catch (error) {
      setErrorMessage("Swap failed. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return <button onClick={handleConnect}>Connect Wallet</button>
  }

  return (
    <div>
      <div>
        <h2>Sell Token</h2>
        <h3>STRK</h3>
        <input onChange={handleChangeInput} disabled={loading}/>
      </div>
      <div>&darr;</div>
      <div>
        <h2>Buy Token</h2>
        <h3>USDC</h3>
        {/*<input*/}
        {/*  readOnly*/}
        {/*  type="text"*/}
        {/*  id="buy-amount"*/}
        {/*  value={(quotes && quotes[0]) ? formatUnits(quotes[0].buyAmount, 6) : ''}*/}
        {/*/>*/}
      </div>
      <button onClick={handleQuickBuy}>Swap</button>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green' }}>Success</p>}
    </div>
  );
}

export default App;
