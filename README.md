# Stake to Vote 

## Intro 

#### Challenge 1
 We want to get a list of all BAR token (ERC20) transfers where the `from` OR the `to` is part of a given list and have happened in the last 2 years.

#### Challenge 2
The company wants to create a platform where users can stake their tokens. This will allow users to participate in (vote) different Surveys. When a user stakes some amount of a particular token (ex: BAR) it gives them the possibility to vote on any survey linked to that token (ie: BAR).

## Improvements

#### Challenge 1
Potential improvements for [Event Scanner](./scripts/event-scanner-rpc.ts):
- Add typings
- Allow for processing more event topics
- Retrieve more information about the tx of that specific event using `eth_getTransactionByHash`
- Allow to connect to multiple networks (currently works only for ethereum mainnet)

Potential improvements for [Alchemy Event Scanner](./scripts/event-scanner-alchemy.ts):
- Add typings
- Add parameters to use all AlchemySDK capabilities from `getAssetTransfer`

#### Challenge 2
Potential improvemens for the StakeToVote contract:
- Use AccessControl instead of simple Ownable 
- Expand the Survey struct to allow for more answers instead of simple binary vote
- Allow voters to change their vote - currently you cannot change your vote

## Dev Guide 

First things first:
```shell
yarn install
```

#### Challenge 1
The EventScanner allows you to retreive specific event logs based on the event topic for a specific set of wallets from a specific certain block number. 

| Parameter     | Alias | Description                                         |
|---------------|-------|-----------------------------------------------------|
| --blocknumber | -b    | Block number after which event logs are retrieved   |
| --wallets     | -w    | List of wallets that are involved in the event logs |
| --topic       | -t    | Event Topic (allows only one topic for now)         |
| --contract    | -c    | Contract for which event logs are retrieved         |

**How to use:**

```shell
## ====================================
## Using Regular RPC endpoint
yarn event-scanner-rpc -w <list_of_wallets> -b <blocknumber> -c <contract> -t <topic>
## Example:
yarn event-scanner-rpc -w '["0x2D5cb10aB59361B1640EFffd0EF99Dfc2263fCe2","0xb23d80f5FefcDDaa212212F028021B41DEd428CF"]' -b 18619366 -c 0xb23d80f5FefcDDaa212212F028021B41DEd428CF -t 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
## ====================================
## Using Alchemy SDK
yarn event-scanner-alchemy -w <list_of_wallets> -b <blocknumber> -c <contract> -t <topic>
## Example:
yarn event-scanner-alchemy -w '["0x2D5cb10aB59361B1640EFffd0EF99Dfc2263fCe2","0xb23d80f5FefcDDaa212212F028021B41DEd428CF"]' -b 18619366 -c 0xb23d80f5FefcDDaa212212F028021B41DEd428CF -t 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
## ====================================
```

> Note: values in the example above are also the default values


#### Challenge 2
For compiling the smart contract: 

```shell
yarn build
```

Fot testing the smart contracts:

```shell
yarn test ## just runs the tests
yarn coverage ## runs the test with coverage report
```

For deploying the contracts

```shell
yarn deploy ## deploys the contracts to local network
yarn deploy --network <network_name> ## deploys the contrats to specific network
```