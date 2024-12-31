import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the "BetContract" using the deployer account and
 * constructor arguments set to the deployer address.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployBetContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("BetContract", {
    from: deployer,
    // Contract constructor arguments
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const betContract = await hre.ethers.getContract<Contract>("BetContract", deployer);
  console.log("🎲 BetContract deployed by:", deployer);
};

export default deployBetContract;

deployBetContract.tags = ["BetContract"];
