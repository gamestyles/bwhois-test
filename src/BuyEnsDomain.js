import React, { useState } from "react";
import { Button, Form, Input, List, message } from "antd";
import axios from "axios";
import Web3 from "web3";

const EthRegistrarController = require('./EthRegistrarControllerABI.json');

const web3 = new Web3(window.ethereum);

const BuyEnsDomain = () => {
  const [loading, setLoading] = useState(false);
  const [domain, setDomain] = useState("");

  const handleBuyDomain = async (values) => {
    try {
      setLoading(true);
      const accounts = await web3.eth.requestAccounts();
      const networkId = await web3.eth.net.getId();
      const networkData = EthRegistrarController.networks[networkId];
      const controller = new web3.eth.Contract(
        EthRegistrarController.abi,
        networkData.address
      );
      const domainHash = web3.utils.sha3(values.domain);
      const commitment = await controller.methods
        .makeCommitment(domainHash, accounts[0])
        .call();
      const response = await axios.post("/api/register", {
        domain: values.domain,
        commitment: commitment,
      });
      await controller.methods
        .register(
          domainHash,
          accounts[0],
          response.data.salt,
          response.data.price
        )
        .send({ from: accounts[0], value: response.data.price });
      message.success(`Domain ${values.domain} bought successfully!`);
      setDomain("");
    } catch (error) {
      console.error(error);
      message.error("Failed to buy domain.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Form onFinish={handleBuyDomain}>
        <Form.Item
          name="domain"
          rules={[{ required: true, message: "Please input a domain name." }]}
        >
          <Input placeholder="Domain name" value={domain} onChange={(e) => setDomain(e.target.value)} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Buy Domain
        </Button>
      </Form>
    </div>
  );
};

export default BuyEnsDomain;
