import React, { ChangeEvent, useState } from 'react';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import type { AccountInterface } from "starknet";
import { connect } from "get-starknet";
import { executeSwap, fetchQuotes, Quote } from "@avnu/avnu-sdk";

const AVNU_OPTIONS = { baseUrl: 'https://goerli.api.avnu.fi' };

const ethAddress = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
const usdcAddress = "0x005a643907b9a4bc6a55e9069c4fd5fd1f5c79a22470690f75556c4736e34426"

function App() {
  const [ account, setAccount ] = useState<AccountInterface>()
  const [ sellAmount, setSellAmount ] = useState<string>()
  const [ quotes, setQuotes ] = useState<Quote[]>([])
  const [ loading, setLoading ] = useState<boolean>(false)
  const [ errorMessage, setErrorMessage ] = useState<string>()
  const [ successMessage, setSuccessMessage ] = useState<string>()

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
      buyTokenAddress: usdcAddress,
      sellAmount: parseUnits(event.target.value, 18),
      takerAddress: account.address,
      size: 1,
    }
    fetchQuotes(params, AVNU_OPTIONS)
      .then((quotes) => {
        setLoading(false)
        setQuotes(quotes)
      })
      .catch(() => setLoading(false));
  }

  const handleSwap = async () => {
    if (!account || !sellAmount || !quotes || !quotes[0]) return;
    setErrorMessage('')
    setSuccessMessage('')
    setLoading(true)
    executeSwap(account, quotes[0], {}, AVNU_OPTIONS)
      .then(() => {
        setSuccessMessage('success')
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
        <h3>USDC</h3>
        <input
          readOnly
          type="text"
          id="buy-amount"
          value={(quotes && quotes[0]) ? formatUnits(quotes[0].buyAmount, 6) : ''}
        />
      </div>
      {loading ? <p>Loading...</p> : quotes && quotes[0] && <button onClick={handleSwap}>Swap</button>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green' }}>Success</p>}
    </div>
  );
}

export default App;
