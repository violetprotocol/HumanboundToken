import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { ExtendLogic, ExtendLogic__factory } from "../src/types";

task("interface")
  .addParam("extendable", "The target Extendable contract to get the full interface from")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const extendLogicFactory: ExtendLogic__factory = <ExtendLogic__factory>(
      await ethers.getContractFactory("ExtendLogic")
    );
    const extendable: ExtendLogic = <ExtendLogic>await extendLogicFactory.attach(taskArguments.extendable);
    const fullInterface = await extendable.callStatic.getFullInterface();
    console.log(fullInterface);
  });
