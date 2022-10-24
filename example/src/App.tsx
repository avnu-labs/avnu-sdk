import React, { ChangeEvent, useState } from 'react';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import type { AccountInterface } from "starknet";
import { connect } from "get-starknet";
import { buildSwapTransaction, executeSwap, getQuotes, Quote } from "@avnu/avnu-sdk";

const ethAddress = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
const wBtcAddress = "0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7"

function App() {
  const [ account, setAccount ] = useState<AccountInterface>()
  const [ sellAmount, setSellAmount ] = useState<string>()
  const [ quotes, setQuotes ] = useState<Quote[]>([])
  const [ loading, setLoading ] = useState<boolean>(false)
  const [ errorMessage, setErrorMessage ] = useState<string>()

  const handleConnect = async () => {
    const starknet = await connect({ modalOptions: { theme: "dark" } });
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
    const params = {
      sellTokenAddress: ethAddress,
      buyTokenAddress: wBtcAddress,
      sellAmount: parseUnits(event.target.value, 18).toString(),
      takerAddress: account.address,
      size: 1,
    }
    getQuotes(params)
      .then((quotes) => {
        setLoading(false)
        setQuotes(quotes)
      })
      .catch(() => setLoading(false));
  }

  const handleSwap = async () => {
    if (!account || !sellAmount || !quotes || !quotes[0]) return;
    setErrorMessage('')
    setLoading(true)
    buildSwapTransaction(quotes[0].quoteId)
      .then((transaction) => executeSwap(account, transaction, ethAddress, parseUnits(sellAmount, 18).toString()))
      .then(() => {
        setLoading(false)
        setQuotes([])
      })
      .catch((error: Error) => {
        setLoading(false)
        setErrorMessage(error.message)
      });
  }

  if (!account) {
    return <button onClick={handleConnect}>Connect Wallet</button>
  }

  return (
    <div>
      <div>
        <h2>Sell Token</h2>
        <h3>ETH</h3>
        <input onChange={handleChangeInput} disabled={loading}/>
      </div>
      <div>&darr;</div>
      <div>
        <h2>Buy Token</h2>
        <h3>WBTC</h3>
        <input
          readOnly
          type="text"
          id="buy-amount"
          value={(quotes && quotes[0]) ? formatUnits(quotes[0].buyAmount, 18) : ''}
        />
      </div>
      {loading ? <p>Loading...</p> : quotes && quotes[0] && <button onClick={handleSwap}>Swap</button>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
}

export default App;
