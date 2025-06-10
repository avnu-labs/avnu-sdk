import React, { useEffect, useState } from 'react';
import { executeSwap, fetchQuotes, fetchTokens, Quote } from "@avnu/avnu-sdk";
import { formatUnits, parseUnits } from 'ethers';
import { RpcProvider, WalletAccount } from 'starknet';
import { connect, StarknetWindowObject } from '@starknet-io/get-starknet';

const AVNU_OPTIONS = { baseUrl: 'https://sepolia.api.avnu.fi' };

const ethAddress = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
const strkAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"
const providerBlastMainnet = new RpcProvider({
  nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_8',
});
function App() {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [sellAmount, setSellAmount] = useState<string>('')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const [tokenSize, setTokenSize] = useState(0);

  useEffect(() => {
    fetchTokens({ page: 0, size: 50, tags: ['Verified'] }).then((page) => setTokenSize(page.totalElements));
  }, []);

  // Fetch quotes
  useEffect(() => {
    if (!sellAmount || !Number(sellAmount) || !address) return;
    const abortController = new AbortController();
    setErrorMessage('')
    setLoading(true)
    const params = {
      sellTokenAddress: ethAddress,
      buyTokenAddress: strkAddress,
      sellAmount: parseUnits(sellAmount, 18),
      takerAddress: address,
      size: 1,
    }
    fetchQuotes(params, { ...AVNU_OPTIONS, abortSignal: abortController.signal })
      .then((quotes) => {
        setLoading(false)
        setQuotes(quotes)
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          setLoading(false)
          setErrorMessage(error)
        }
      });
    return () => abortController.abort();
  }, [address, sellAmount]);

  interface StarknetWalletProvider extends StarknetWindowObject {
  }
  const handleConnect = async () => {
    const selectedWalletSWO = await connect({ modalMode: 'alwaysAsk', modalTheme: 'light' });
    const myWalletAccount = await WalletAccount.connect(
      providerBlastMainnet,
      selectedWalletSWO as StarknetWalletProvider
    );
    setAccount(myWalletAccount);
    setAddress(myWalletAccount.address);
  }


  const handleSwap = async () => {
    if (!account || !sellAmount || !quotes || !quotes[0]) return;
    setErrorMessage('')
    setSuccessMessage('')
    setLoading(true)
    executeSwap(account, quotes[0], {}, AVNU_OPTIONS)
      .then((response) => {
        setSuccessMessage(`Success: executed tx ${response.transactionHash}`)
        setLoading(false)
        setQuotes([])
      })
      .catch((error: Error) => {
        setLoading(false)
        setErrorMessage(error.message)
      });
  }

  if (!address) {
    return (
      <>
        <button onClick={async () => handleConnect()}>Connect</button>
      </>
    )
  }

  return (
    <div>
      <div>
        <p>{address}</p>
        <h2>Sell Token</h2>
        <h3>ETH</h3>
        <input onChange={(event) => setSellAmount(event.target.value)} disabled={loading}/>
      </div>
      <div>&darr;</div>
      <div>
        <h2>Buy Token</h2>
        <h3>STRK</h3>
        <input
          readOnly
          type="text"
          id="buy-amount"
          value={(quotes && quotes[0]) ? formatUnits(quotes[0].buyAmount, 18) : ''}
        />
      </div>
      {loading ? <p>Loading...</p> : quotes && quotes[0] && <button onClick={handleSwap}>Swap</button>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {tokenSize && <p>Found {tokenSize} Verified tokens</p>}
    </div>
  );
}

export default App;
