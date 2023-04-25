import React, { useState, useEffect } from 'react';
import { Button, Input, notification } from 'antd';
import { List, message, Avatar, Spin } from 'antd';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Web3 from 'web3';
import { ethers } from 'ethers';

const EthRegistrarControllerABI = require('./OldEthRegistrarControllerABI.json');
const EthRegistrarControllerAddress = '0x283af0b28c62c092c9727f1ee09c02ca627eb7f5'

// const TestEthRCABI = require('./TestOldEthRegistrarControllerABI.json');
// const TestEthRCAddress = '0x283af0b28c62c092c9727f1ee09c02ca627eb7f5';

// const TestEthRCABI = require('./TestBaseRABI.json');
// const TestEthRCAddress = '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85';

const web3 = new Web3(Web3.givenProvider);
// log current provider
console.log('web3.currentProvider ', web3.currentProvider);
// log current provider network
web3.eth.net.getNetworkType().then(console.log);
const eth = web3.eth;

const EthRegistrarControllerContract = new eth.Contract(EthRegistrarControllerABI, EthRegistrarControllerAddress);
// const EthRegistrarControllerContract = new eth.Contract(TestEthRCABI, TestEthRCAddress);

const BuyENS = () => {
  const [loading, setLoading] = useState(false);
  const [domainName, setDomainName] = useState('');
  const location = useLocation();

  // Set the default value of the input field based on the "domain" query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const domainParam = searchParams.get('domain');
    if (domainParam) {
      setDomainName(domainParam.split('.').slice(0, -1).join('.'));
    }
  }, [location.search]);

  const buyDomainWithBaseRegister = async () => {
    setLoading(true);

    try {
      await window.ethereum.enable(); // connect to Metamask

      const accounts = await web3.eth.getAccounts();
      const owner = accounts[0];
      const duration = 31536000; // 1 year
      // const amount = web3.utils.toWei('1', 'ether');
      const label = web3.utils.sha3(domainName);
      // keccak256 of domain name
      const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(domainName));
      console.log(labelHash);

      const gasPrice = await web3.eth.getGasPrice();
      console.log('gasPrice', gasPrice);
      // const rentPrice = await EthRegistrarControllerContract.methods.rentPrice(label, duration).call();
      const txHash = await EthRegistrarControllerContract.methods.register(label, owner, duration).send(
        { 
          from: owner,
          gasPrice: gasPrice,
          gas: 100000
        });

      console.log('txHash', txHash);

      setLoading(false);

      notification.success({
        message: 'Domain Bought Successfully',
        description: `Your domain ${domainName}.eth has been successfully registered!`,
      });
    } catch (err) {
      setLoading(false);

      console.error(err);

      notification.error({
        message: 'Error',
        description: `Failed to register ${domainName}.eth: ${err}`,
      });
    }
  };

  const buyDomainUsingERC = async () => {
    // setDomainName(domainName.split('.').slice(0, -1).join('.'));
    console.log(domainName)
    setLoading(true);
    try {
      await window.ethereum.enable(); // connect to Metamask
      const accounts = await web3.eth.getAccounts();
      const owner = accounts[0];
      const duration = 31536000; // 1 year
      const gasPrice = await web3.eth.getGasPrice();

      // Generate a random value to mask our commitment
      const random = new Uint8Array(32);
      crypto.getRandomValues(random);
      const salt = "0x" + Array.from(random).map(b => b.toString(16).padStart(2, "0")).join("");

      // Submit our commitment to the smart contract
      const commitment = await EthRegistrarControllerContract.methods.makeCommitment(domainName, owner, salt).call();
      notification.info({
        message: 'Making Commitment',
        description: `Commitment ${commitment} made for ${domainName}.eth`,
      });
      const tx = await EthRegistrarControllerContract.methods.commit(commitment).send(
        { from: owner }
      );
      console.log('tx', tx);
      notification.success({
        message: 'Commitment Success',
        description: `${tx}`,
      });

      // Add 10% to account for price fluctuation; the difference is refunded.
      const price = (await EthRegistrarControllerContract.methods.rentPrice(domainName, duration).call()) * 1.1;
      console.log('price', price);
      // console.log((web3.utils.toWei('0.01', 'ether')))

      // Wait 60 seconds before registering
      notification.info({
        message: 'Waiting 60 seconds',
        description: `Registering with gas price ${gasPrice} and value of ${Math.round(price)}`,
      });
      setTimeout(async () => {
        // Submit our registration request
        const rValue = await EthRegistrarControllerContract.methods.register(domainName, owner, duration, salt).send(
          { from: owner, gasPrice: gasPrice, gas: 300000, value: Math.round(price).toString() }
        );
        console.log('rValue', rValue);

        setLoading(false);

        notification.success({
          message: 'Domain Bought Successfully',
          description: `Your domain ${domainName}.eth has been successfully registered!`,
        });
      }, 60000);
    } catch (err) {
      setLoading(false);

      console.error(err);

      notification.error({
        message: 'Error',
        description: `Failed to register ${domainName}.eth: ${err}`,
      });
    }
  }

  const handleDomainNameChange = (event) => {
    setDomainName(event.target.value);
  };

  return (
    <div className="container">
      <h1 className="title">Buy ENS Domain</h1>
      <div className="form-container">
        <Input className="input" placeholder="Enter Domain Name" onChange={handleDomainNameChange} value={domainName} />
        <Button className="button" type="primary" onClick={buyDomainUsingERC} disabled={!domainName}>
          {loading ? <Spin /> : 'Buy Domain'}
        </Button>
      </div>
    </div>
  );
};

export default BuyENS;
