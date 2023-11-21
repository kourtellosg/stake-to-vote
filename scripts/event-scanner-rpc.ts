import * as ethers from "ethers";
const axios = require("axios");
import { handleArgs } from "./arg-handler";

require("dotenv").config();

const rpcCall = (data: string) => {
  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const callConfig = { ...config, ...{ data: data } };
  return axios.request(callConfig);
};

const main = () => {
  const { contactAddress, blockNumber, eventTopic, wallets } = handleArgs();
  const rpcRequest = JSON.stringify({
    id: 0,
    jsonrpc: "2.0",
    method: "eth_getLogs",
    params: [
      {
        address: contactAddress,
        fromBlock: `0x${blockNumber.toString(16)}`,
        topics: [eventTopic],
      },
    ],
  });

  rpcCall(rpcRequest)
    .then((response: any) => {
      const filteredTransfers: any = [];
      const hexifiedWallets = addressArrayToHex(wallets as string[]);
      response.data.result.forEach((element: any) => {
        if (findOne(element.topics, hexifiedWallets)) {
          // TODO: retrieve transactio data using `eth_getTransactionByHash`
          filteredTransfers.push(element);
        }
      });
      console.log(filteredTransfers);
    })
    .catch((error: any) => {
      console.log(error);
    });
};

const findOne = (haystack: any[], arr: any[]) => {
  return arr.some((v) => haystack.includes(v));
};

const addressArrayToHex = (addresses: string[]): string[] => {
  const hexArray: string[] = [];
  addresses.forEach((a) => {
    hexArray.push(addressToHex(a));
  });
  return hexArray;
};

const addressToHex = (address: string) => {
  return ethers.AbiCoder.defaultAbiCoder().encode(["address"], [address]);
};

main();
