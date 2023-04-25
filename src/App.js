import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Input, List } from 'antd';
import axios from 'axios';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import './App.css';

const API_KEY = '35792ba976ff11f069c6beebd4d0e754';
const ENS_OPENSEA_CONTRACT = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85'
const UD_OPENSEA_CONTRACT = '0xd1e5b0ff1287aa9f9a268759062e4ab08b9dacbe'
const tlds = ['eth' ,'crypto', 'nft', 'wallet', 'x', 'dao', 'bitcoin', '888', 'blockchain'];

const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
  cache: new InMemoryCache(),
});

const ud_client = new ApolloClient({
  uri: `https://gateway.thegraph.com/api/${API_KEY}/subgraphs/id/3BP4XUNZmC2Ng1fRj6dx7f8bHy1yHuuf22VtDptv72aE`,
  cache: new InMemoryCache(),
});

const searchUnstoppableDomains = async (name) => {
  const query = gql`
    {
      domains(where: { name_in: ["${name}.crypto", "${name}.nft", "${name}.wallet", "${name}.x", "${name}.dao", "${name}.bitcoin", "${name}.888", "${name}.blockchain"] }) {
        id
        name
      }
    }
  `;
  const { data } = await ud_client.query({ query });
  return data.domains;
};

const searchEnsDomains = async (name) => {
  const response = await axios.post('https://api.thegraph.com/subgraphs/name/ensdomains/ens', {
    query: `
      {
        domains(where: { name: "${name}.eth" }) {
          id
          name
        }
      }
    `
  });
  return response.data.data.domains;
};

const App = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const [ensResult, unstoppableResult] = await Promise.all([
        searchEnsDomains(searchTerm),
        searchUnstoppableDomains(searchTerm)
      ]);
      const result = [];
      for (const tld of tlds) {
        const domainName = searchTerm+'.'+tld;
        result.push({ name: domainName, available: true });
      }
      if (ensResult.length > 0) {
        // find the domain name in the result and set available to false
        for (const domain of ensResult) {
          const index = result.findIndex((item) => item.name === domain.name);
          if (index > -1) {
            result[index].available = false;
          }
        }
        // result.push({ name: ensResult[0].name, available: false });
      }
      if (unstoppableResult.length > 0) {
        for (const domain of unstoppableResult) {
          const index = result.findIndex((item) => item.name === domain.name);
          if (index > -1) {
            result[index].available = false;
            continue;
          }
          result.push({ name: domain.name, available: false });
        }
      }
      setDomains(result);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Blockchain Whois</h1>
      <div className="search-bar">
        <Input.Search placeholder="Enter your domain name" onSearch={(v, e) => {
          handleSearch();
        }} enterButton="Search" onChange={(e) => {setSearchTerm(e.target.value)}} />
      </div>

      {loading && <div className="loader">Loading...</div>}

      {!loading && 
      <div className={domains.length ? 'show-results' : 'hide-results'}>
        <List
          dataSource={domains}
          renderItem={(item) => (
            <List.Item className={item.available ? 'available' : 'taken'}>
              <List.Item.Meta
                title={
                  <div className="item-title">
                    <img
                      src={item.name.endsWith('.eth') ? '/ens.png' : '/ud-logo.png'}
                      alt={`${item.name} logo`}
                      className="item-icon"
                    />
                    {item.name}
                  </div>
                }
              />
              <div className="item-availability">
                {item.available ? (
                  <div style={{ color: 'green' }}>Available</div>
                ) : (
                  <div style={{ color: 'red' }}>Taken</div>
                )}
              </div>
              <div className="item-buttons">
                <a href={item.name.endsWith('.eth') ? `https://app.ens.domains/name/${item.name}/details` : `https://unstoppabledomains.com/search?searchTerm=${item.name}`}
                 target="_blank" rel="noopener noreferrer">Visit</a>
                {!item.available && <a href={`https://opensea.io/assets?search[query]==${item.name}`} target="_blank" rel="noopener noreferrer">OpenSea</a>}
                {item.available && item.name.includes(".eth") && <a onClick={() => window.open(`/BuyENS?domain=${item.name}`, '_blank')}>Buy</a>}
              </div>
            </List.Item>
          )}
        />
      </div>
      }

      {!loading && !domains.length && <div className="no-results">No results</div>}
    </div>
  );
}

export default App;
