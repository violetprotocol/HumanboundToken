import { ContractTransaction } from "ethers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { SoulBurnLogic } from "../../src/types";

task("soultoken:burn")
  .addParam("address", "Contract address of SoulToken")
  .addParam("id", "TokenID of the token being burnt")
  .addOptionalParam("burnproof", "URI containing a proof of why the token is to be burned")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsBurn = <SoulBurnLogic>await ethers.getContractAt("SoulBurnLogic", taskArguments.address);

    let tx: ContractTransaction;
    console.log("Burning...");
    try {
      if (taskArguments.burnproof) {
        tx = await soulTokenAsBurn["burn(uint256,string)"](taskArguments.id, taskArguments.burnproof);
      } else {
        tx = await soulTokenAsBurn["burn(uint256)"](taskArguments.id);
      }
      const receipt = await tx.wait();

      console.log(`Soul token ${taskArguments.id} burnt!`);
      console.log(`Transaction: ${receipt.transactionHash}`);
    } catch (e) {
      console.log(e);
    }
  });
