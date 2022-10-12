import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { HumanboundPermissionLogic } from "../../src/types";

task("humanboundtoken:updateOperator")
  .addParam("address", "Address of HumanboundToken smart contract")
  .addParam("operator", "Address of the new operator")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const newOperator = taskArguments.operator;
    if (!newOperator || newOperator === ethers.constants.AddressZero) {
      throw new Error("Invalid operator address");
    }
    const humanboundTokenAsPermissionLogic = <HumanboundPermissionLogic>(
      await ethers.getContractAt("HumanboundPermissionLogic", taskArguments.address)
    );

    try {
      const tx = await humanboundTokenAsPermissionLogic.updateOperator(taskArguments.operator);
      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction reverted :(");
      } else {
        console.log("Operator successfully updated to:", newOperator);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
      }
    } catch (error) {
      console.error(error);
    }
  });

task("humanboundtoken:getOperator")
  .addParam("address", "Address of HumanboundToken smart contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsPermissionLogic = <HumanboundPermissionLogic>(
      await ethers.getContractAt("HumanboundPermissionLogic", taskArguments.address)
    );

    const operator = await humanboundTokenAsPermissionLogic.callStatic.getOperator();

    console.log(`Current Operator: ${operator}`);
  });
