# AVNU-SDK

AVNU-sdk is a typeScript SDK for building exchange functionality on Layers 2 with the AVNU API.

## Installation

```shell
npm install @avnu/avnu-sdk

# or

yarn add @avnu/avnu-sdk
```

## Usage

```ts
const params = {
  sellTokenAddress: ethAddress,
  buyTokenAddress: wBtcAddress,
  sellAmount: formatUnits('200000000000000000', 18),
  takerAddress: account.address,
}
const quotes = await fetchQuotes(params);
await executeSwap(account, quotes[0]);
```

## Example

This repository includes a basic example in the `[/examples](/examples)` folder.
