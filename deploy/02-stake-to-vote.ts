import "@nomiclabs/hardhat-ethers";
import hre from "hardhat";
import "hardhat-deploy";
import {
  DeployFunction,
  DeploymentSubmission,
} from "hardhat-deploy/dist/types";

export const stakeToVoteName = "StakeToVote";
export const dummyERC20Name = "DummyERC20";

export const MIN_STAKE_AMOUNT = hre.ethers.parseUnits("1", "ether");

export const stakeTokens = [];

const deployStakeToVote: DeployFunction = async function () {
  let tokenAddress: string;

  if (hre.network.name === "hardhat") {
    const token = await hre.deployments.getOrNull(dummyERC20Name);
    tokenAddress = token!.address;
  } else {
    tokenAddress = ""; // TODO: Use testnet/mainnet token
  }

  const stakeToVote = await hre.ethers.getContractFactory(stakeToVoteName);

  const proxy = await hre.upgrades.deployProxy(
    stakeToVote,
    [tokenAddress, MIN_STAKE_AMOUNT],
    {
      initializer: "initialize",
    }
  );

  await proxy.waitForDeployment();
  const contractAddress = await proxy.getAddress();

  const artifact = await hre.deployments.getExtendedArtifact(stakeToVoteName);
  await hre.deployments.save(stakeToVoteName, {
    ...artifact,
    ...{ address: contractAddress },
  } as DeploymentSubmission);

  console.log("StakeToVote deployed to:", contractAddress);
};

deployStakeToVote.id = "deploy-stake-to-vote";
deployStakeToVote.tags = ["stake-to-vote", "test"];
export default deployStakeToVote;
