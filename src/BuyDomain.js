import { Button, Input } from "antd";
import { Web3ReactProvider, useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useState } from "react";
// import { EthRegistrarControllerABI } from "./EthRegistrarControllerABI.json";
import { Contract } from "@ethersproject/contracts";

const EthRegistrarControllerABI = require('./EthRegistrarControllerABI.json');
function getLibrary(provider) {
  return new Web3Provider(provider);
}

function BuyDomain() {
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { account, library, activate } = useWeb3React();

  const handleConnectWallet = () => {
    console.log("handleConnectWallet");
    activate();
  };

  const handleBuyDomain = async () => {
    setIsLoading(true);
    const registrarAddress = "0xXYZ";
    const registrarContract = new Contract(registrarAddress, EthRegistrarControllerABI, library.getSigner());
    const tx = await registrarContract.register(domain);
    await tx.wait();
    setIsLoading(false);
  };

  return (
    <div>
      <h1>Buy ENS Domain</h1>
      {account ? (
        <div>
          <Input placeholder="Domain" onChange={(e) => setDomain(e.target.value)} />
          <Button onClick={handleBuyDomain} loading={isLoading}>
            Buy Domain
          </Button>
        </div>
      ) : (
        <Button onClick={handleConnectWallet}>Connect Wallet</Button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <BuyDomain />
    </Web3ReactProvider>
  );
}
