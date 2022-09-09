import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { deploy } from "../helpers";

task("deploy:extension")
  .addParam("name", "Extension contract name to deploy. Must be constructorless.")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const contract = await deploy(ethers, taskArguments.name);
    console.log(`${taskArguments.name} deployed to: `, contract.address);
  });
