import { LedgerSigner } from "@anders-t/ethers-ledger";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { deploy, deployWithLedger } from "../helpers";

task("deploy:extension", "Deploys a specified constructorless Extension")
  .addParam("name", "Extension contract name to deploy. Must be constructorless.")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const contract = await deploy(ethers, taskArguments.name);
    console.log(`${taskArguments.name} deployed to: `, contract.address);
  });

task("hd:deploy:extension", "Deploys a specified constructorless Extension")
  .addParam("name", "Extension contract name to deploy. Must be constructorless.")
  .setAction(async function (taskArguments: TaskArguments, { ethers, network }) {
    const ledger = new LedgerSigner(ethers.provider);

    const contract = await deployWithLedger(ledger, network, ethers, taskArguments.name);
    console.log(`${taskArguments.name} deployed to: `, contract.address);
  });
