import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { sepolia } from "@starknet-react/chains";
import { argent, braavos, publicProvider, StarknetConfig, } from "@starknet-react/core";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const chains = [sepolia];
const provider = publicProvider();
const connectors = [braavos(), argent()];

root.render(
  <React.StrictMode>
    <StarknetConfig chains={chains} provider={provider} connectors={connectors}>
      <App/>
    </StarknetConfig>
  </React.StrictMode>
);
