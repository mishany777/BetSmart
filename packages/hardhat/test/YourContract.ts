const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BetContract", function () {
  let BetContract;
  let betContract;
  let owner;
  let player1;
  let player2;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    const BetContractFactory = await ethers.getContractFactory("BetContract");
    betContract = await BetContractFactory.deploy(owner.address);
    await betContract.deployed();
  });

  it("should allow creating a bet", async function () {
    await betContract.connect(player1).createBet(player2.address, "Will it rain tomorrow?", {
      value: ethers.utils.parseEther("1"),
    });

    const bet = await betContract.bets(0);

    expect(bet.creator).to.equal(player1.address);
    expect(bet.acceptor).to.equal(player2.address);
    expect(bet.description).to.equal("Will it rain tomorrow?");
    expect(bet.amount).to.equal(ethers.utils.parseEther("1"));
    expect(bet.resolved).to.equal(false);
  });

  it("should allow accepting a bet", async function () {
    await betContract.connect(player1).createBet(player2.address, "Will it rain tomorrow?", {
      value: ethers.utils.parseEther("1"),
    });

    await betContract.connect(player2).acceptBet(0, { value: ethers.utils.parseEther("1") });

    const bet = await betContract.bets(0);
    expect(bet.accepted).to.equal(true);
  });

  it("should allow resolving a bet by the owner", async function () {
    await betContract.connect(player1).createBet(player2.address, "Will it rain tomorrow?", {
      value: ethers.utils.parseEther("1"),
    });
    await betContract.connect(player2).acceptBet(0, { value: ethers.utils.parseEther("1") });

    await betContract.connect(owner).resolveBet(0, true);

    const bet = await betContract.bets(0);
    expect(bet.resolved).to.equal(true);
    expect(await ethers.provider.getBalance(player1.address)).to.be.above(ethers.utils.parseEther("10000")); // Assuming test balance
  });

  it("should revert if a non-owner tries to resolve a bet", async function () {
    await betContract.connect(player1).createBet(player2.address, "Will it rain tomorrow?", {
      value: ethers.utils.parseEther("1"),
    });
    await betContract.connect(player2).acceptBet(0, { value: ethers.utils.parseEther("1") });

    await expect(betContract.connect(player1).resolveBet(0, true)).to.be.revertedWith("Not the Owner");
  });
});
