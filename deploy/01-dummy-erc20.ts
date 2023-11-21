import "@nomiclabs/hardhat-ethers";
import hre from "hardhat";
import "hardhat-deploy";
import {
  DeployFunction,
  DeploymentSubmission,
} from "hardhat-deploy/dist/types";

export const stakeToVoteName = "StakeToVote";
export const dummyERC20Name = "DummyERC20";

const deployDummyErc20: DeployFunction = async function () {
  const total = hre.ethers.parseUnits("100000", "ether"); // 100k
  const dummyERC20 = await hre.ethers.deployContract(dummyERC20Name, [total]);

  await dummyERC20.waitForDeployment();
  const tokenAddress = await dummyERC20.getAddress();
  const artifact = await hre.deployments.getExtendedArtifact(dummyERC20Name);

  await hre.deployments.save(dummyERC20Name, {
    ...artifact,
    ...{ address: tokenAddress },
  } as DeploymentSubmission);

  console.log("Dummy ERC20 token deployed to:", tokenAddress);
};

deployDummyErc20.id = "deploy-dummy-erc20";
deployDummyErc20.tags = ["dummy-erc20", "test"];
export default deployDummyErc20;
