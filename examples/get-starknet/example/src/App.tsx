import React, { ChangeEvent, useEffect, useState } from 'react';
import type { AccountInterface } from "starknet";
import { connect } from "get-starknet";
import { executeSwap, fetchQuotes, fetchTokens, Quote } from "@avnu/avnu-sdk";
import { formatUnits, parseUnits } from 'ethers';

const AVNU_OPTIONS = { baseUrl: 'https://sepolia.api.avnu.fi' };

const ethAddress = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
const strkAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"

function App() {
  const [ account, setAccount ] = useState<AccountInterface>()
  const [ sellAmount, setSellAmount ] = useState<string>()
  const [ quotes, setQuotes ] = useState<Quote[]>([])
  const [ loading, setLoading ] = useState<boolean>(false)
  const [ errorMessage, setErrorMessage ] = useState<string>()
  const [ successMessage, setSuccessMessage ] = useState<string>()
  const [ tokenSize, setTokenSize ] = useState(0);

  const handleConnect = async () => {
    const starknet = await connect();
    if (!starknet) return;
    await starknet.enable();
    if (starknet.isConnected && starknet.provider && starknet.account.address) {
      setAccount(starknet.account)
    }
  }

  useEffect(() => {
    fetchTokens({page: 0, size: 50, tags: ['Verified']}).then((page) => setTokenSize(page.totalElements));
  }, []);

  const handleChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (!account) return;
    setErrorMessage('')
    setQuotes([])
    setSellAmount(event.target.value);
    setLoading(true)
    const params = {
      sellTokenAddress: ethAddress,
      buyTokenAddress: strkAddress,
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
        <h3>STRK</h3>
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
      {tokenSize && <p>Found {tokenSize} Verified tokens</p>}
    </div>
  );
}

export default App;
