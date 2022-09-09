import { ContractTransaction } from "ethers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { HumanboundBurnLogic } from "../../src/types";

task("humanboundtoken:burn")
  .addParam("address", "Contract address of HumanboundToken")
  .addParam("id", "TokenID of the token being burnt")
  .addOptionalParam("burnproof", "URI containing a proof of why the token is to be burned")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsBurn = <HumanboundBurnLogic>(
      await ethers.getContractAt("HumanboundBurnLogic", taskArguments.address)
    );

    let tx: ContractTransaction;
    console.log("Burning...");
    try {
      if (taskArguments.burnproof) {
        tx = await humanboundTokenAsBurn["burn(uint256,string)"](taskArguments.id, taskArguments.burnproof);
      } else {
        tx = await humanboundTokenAsBurn["burn(uint256)"](taskArguments.id);
      }
      const receipt = await tx.wait();

      console.log(`Humanbound token ${taskArguments.id} burnt!`);
      console.log(`Transaction: ${receipt.transactionHash}`);
    } catch (e) {
      console.log(e);
    }
  });
