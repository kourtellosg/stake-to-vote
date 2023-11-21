import hre from "hardhat";
import { ethers, deployments } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  MIN_STAKE_AMOUNT,
  dummyERC20Name,
  stakeToVoteName,
} from "../deploy/02-stake-to-vote";
import { StakeToVote } from "../dist/types/contracts/StakeToVote";
import { DummyERC20 } from "../dist/types/contracts/mocks/DummyERC20";
import { Signer, ZeroAddress } from "ethers";

describe("StakeToVote", function () {
  let stakeToVoteAsOwner: StakeToVote;
  let stakeToVoteAsStaker1: StakeToVote;
  let stakeToVoteAddress: string;

  let dummyERC20AsDeployer: DummyERC20;
  let dummyERC20AsStaker1: DummyERC20;
  let dummyERC20Address: string;

  let owner: Signer;
  let ownerAddress: string;
  let staker1: Signer;
  let staker1Address: string;

  this.beforeAll("setup tests and deploy contracts", async function () {
    const signers = await hre.ethers.getSigners();
    owner = signers[0];
    staker1 = signers[1];

    ownerAddress = await owner.getAddress();
    staker1Address = await staker1.getAddress();
    await deployments.fixture(["test"]);
    const dummyERC20 = await deployments.getOrNull(dummyERC20Name);
    dummyERC20Address = dummyERC20!.address;

    const stakeToVote = await deployments.getOrNull(stakeToVoteName);
    stakeToVoteAddress = stakeToVote!.address;

    stakeToVoteAsOwner = (await ethers.getContractAt(
      stakeToVoteName,
      stakeToVoteAddress,
      owner
    )) as unknown as StakeToVote;
    stakeToVoteAsStaker1 = (await ethers.getContractAt(
      stakeToVoteName,
      stakeToVoteAddress,
      staker1
    )) as unknown as StakeToVote;

    dummyERC20AsDeployer = (await ethers.getContractAt(
      dummyERC20Name,
      dummyERC20Address,
      owner
    )) as unknown as DummyERC20;
    dummyERC20AsStaker1 = (await ethers.getContractAt(
      dummyERC20Name,
      dummyERC20Address,
      staker1
    )) as unknown as DummyERC20;
    // Transfer some ERC20 to another wallet for testing
    await dummyERC20AsDeployer.transfer(
      staker1Address,
      hre.ethers.parseUnits("1000", "ether")
    );
    await dummyERC20AsDeployer.approve(
      stakeToVoteAddress,
      hre.ethers.parseUnits("1000", "ether")
    );
    await dummyERC20AsStaker1.approve(
      stakeToVoteAddress,
      hre.ethers.parseUnits("1000", "ether")
    );
  });

  it("initialized correctly", async function () {
    const surveyCounter = await stakeToVoteAsOwner.surveyCounter();
    expect(surveyCounter).to.equal(1);
    const stakeToke = await stakeToVoteAsOwner.stakeToken();
    expect(stakeToke).to.equal(await dummyERC20AsDeployer.getAddress());
    const minStake = await stakeToVoteAsOwner.minStakeAmount();
    expect(minStake).to.equal(MIN_STAKE_AMOUNT);
  });

  it("addSurvey() - adds a new survey", async function () {
    const surveyDescription = "some survey";

    await expect(stakeToVoteAsOwner.addSurvey(surveyDescription))
      .to.emit(stakeToVoteAsOwner, "SurveyAdded")
      .withArgs(1, surveyDescription);

    const survey = await stakeToVoteAsOwner.surveys(1);
    expect(survey.description).to.equal(surveyDescription);
    expect(survey.totalVotes).to.equal(0);
    expect(survey.inFavour).to.equal(0);
    expect(survey.createdAt).to.equal(await time.latest());
  });

  it("addSurvey() - revert if NOT called by the owner", async function () {
    await expect(stakeToVoteAsStaker1.addSurvey("some survey")).to.be.reverted;
  });

  it("stake() - update on-chain data / transfer tokens / emit event", async function () {
    const stakeAmount = hre.ethers.parseUnits("10", "ether");
    // Transfer of tokens
    await expect(
      stakeToVoteAsStaker1.stake(stakeAmount)
    ).to.changeTokenBalances(
      dummyERC20AsDeployer,
      [stakeToVoteAddress, staker1Address],
      [stakeAmount, -stakeAmount]
    );
    // event
    await expect(stakeToVoteAsStaker1.stake(stakeAmount))
      .to.emit(stakeToVoteAsStaker1, "StakeUpdated")
      .withArgs(staker1Address, hre.ethers.parseUnits("20", "ether"));
    // on-chain data
    const stakeAmountForWallet = await stakeToVoteAsStaker1.accountStake(
      staker1Address
    );
    expect(stakeAmountForWallet).to.equal(hre.ethers.parseUnits("20", "ether"));
  });

  it("stake() - should revert if amount is less than minimum", async function () {
    const stakeAmount = hre.ethers.parseUnits("0.9", "ether");
    await expect(
      stakeToVoteAsStaker1.stake(stakeAmount)
    ).to.be.revertedWithCustomError(
      { interface: stakeToVoteAsStaker1.interface },
      "StakeAmountLessThanMin"
    );
  });

  it("vote() in favour - update data / emit event / cannot vote again", async function () {
    await expect(stakeToVoteAsStaker1.vote(1, true))
      .to.emit(stakeToVoteAsStaker1, "VotedForSurvey")
      .withArgs(1, staker1Address, true);
    const survey = await stakeToVoteAsOwner.surveys(1);
    expect(survey.totalVotes).to.equal(1);
    expect(survey.inFavour).to.equal(1);

    await expect(stakeToVoteAsStaker1.vote(1, false))
      .to.be.revertedWithCustomError(
        { interface: stakeToVoteAsStaker1.interface },
        "AlreadyVoted"
      )
      .withArgs(staker1Address);
  });

  it("vote() against - update data / emit event / cannot vote again", async function () {
    const stakeAmount = hre.ethers.parseUnits("10", "ether");
    await stakeToVoteAsOwner.stake(stakeAmount);
    await expect(stakeToVoteAsOwner.vote(1, false))
      .to.emit(stakeToVoteAsStaker1, "VotedForSurvey")
      .withArgs(1, ownerAddress, false);
    const survey = await stakeToVoteAsOwner.surveys(1);
    expect(survey.totalVotes).to.equal(2);
    expect(survey.inFavour).to.equal(1);

    await expect(stakeToVoteAsOwner.vote(1, false))
      .to.be.revertedWithCustomError(
        { interface: stakeToVoteAsOwner.interface },
        "AlreadyVoted"
      )
      .withArgs(ownerAddress);
  });

  it("unstake() - update on-chain data / transfer tokens / emit event ", async function () {
    const stakeAmount = hre.ethers.parseUnits("10", "ether");
    // transfer of tokens
    await expect(
      stakeToVoteAsStaker1.unstake(stakeAmount)
    ).to.changeTokenBalances(
      dummyERC20AsDeployer,
      [stakeToVoteAddress, staker1Address],
      [-stakeAmount, stakeAmount]
    );
    // event
    await expect(stakeToVoteAsStaker1.unstake(stakeAmount))
      .to.emit(stakeToVoteAsStaker1, "StakeUpdated")
      .withArgs(staker1Address, 0);

    const stakeAmountForWallet = await stakeToVoteAsStaker1.accountStake(
      staker1Address
    );
    expect(stakeAmountForWallet).to.equal(0);
  });

  it("stake() - should revert there are no staked tokens", async function () {
    const stakeAmount = hre.ethers.parseUnits("1", "ether");
    await expect(
      stakeToVoteAsStaker1.unstake(stakeAmount)
    ).to.be.revertedWithCustomError(
      { interface: stakeToVoteAsStaker1.interface },
      "NotEnoughStake"
    );
  });

  it("vote() - should revert if there is no stake ", async function () {
    await expect(
      stakeToVoteAsStaker1.vote(1, true)
    ).to.be.revertedWithCustomError(
      { interface: stakeToVoteAsStaker1.interface },
      "NotEnoughStakeToVote"
    );
  });

  describe("Wrong initialization", function () {
    it("should revert if token address is ZERO_ADDRESS", async function () {
      const stakeToVote = await hre.ethers.getContractFactory(stakeToVoteName);
      await expect(
        hre.upgrades.deployProxy(stakeToVote, [ZeroAddress, MIN_STAKE_AMOUNT], {
          initializer: "initialize",
        })
      ).to.be.revertedWithCustomError(
        { interface: stakeToVoteAsStaker1.interface },
        "InvalidStakeToken"
      );
    });
  });
});
