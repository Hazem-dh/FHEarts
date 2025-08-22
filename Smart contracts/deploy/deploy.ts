import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHERC20 = await deploy("FHEarts", {
    from: deployer,

    log: true,
  });

  console.log(`FHEarts contract: `, deployedFHERC20.address);
};
export default func;
func.id = "deploy_FHEarts"; // id required to prevent reexecution
func.tags = ["FHEarts"];
