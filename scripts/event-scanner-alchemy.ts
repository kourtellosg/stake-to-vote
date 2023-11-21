// index.js
import { Network, Alchemy, AssetTransfersCategory } from "alchemy-sdk";
import { handleArgs } from "./arg-handler";

require("dotenv").config();

const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};

const main = () => {
  const { contactAddress, blockNumber, wallets } = handleArgs();
  const alchemy = new Alchemy(settings);
  const filteredTransfers: any = [];
  for (let wallet of wallets) {
    alchemy.core
      .getAssetTransfers({
        fromBlock: `0x${blockNumber.toString(16)}`,
        contractAddresses: [contactAddress],
        fromAddress: wallet,
        category: [AssetTransfersCategory.ERC20],
      })
      .then((fromTransfersRes) => {
        fromTransfersRes.transfers.forEach((transfer) => {
          filteredTransfers.push(transfer);
        });
        alchemy.core
          .getAssetTransfers({
            fromBlock: `0x${blockNumber.toString(16)}`,
            contractAddresses: [contactAddress],
            toAddress: wallet,
            category: [AssetTransfersCategory.ERC20],
          })
          .then((fromTransfersRes) => {
            fromTransfersRes.transfers.forEach((transfer) => {
              filteredTransfers.push(transfer);
            });
            console.log(filteredTransfers);
          })
          .catch(console.error);
      })
      .catch(console.error);
  }
};

main();
