import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { deploy } from "../helpers";

task("deploy:Extendable")
  .addParam("extend", "ExtendLogic extension contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const extendable = await deploy(ethers, "Extendable", taskArguments.extend);
    console.log(`Extendable deployed to: `, extendable.address);
  });
