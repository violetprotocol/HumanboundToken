import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { GetterLogic } from "../../src/types";

task("humanboundtoken:ownerOf")
  .addParam("address", "Contract address of HumanboundToken")
  .addParam("id", "TokenID to check the owner of")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsGetter = <GetterLogic>await ethers.getContractAt("GetterLogic", taskArguments.address);

    const owner = await humanboundTokenAsGetter.callStatic.ownerOf(taskArguments.id);

    console.log(`Owner of token ${taskArguments.id}: ${owner}!`);
  });

task("humanboundtoken:balanceOf")
  .addParam("address", "Contract address of HumanboundToken")
  .addParam("user", "User address to check the balance of")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsGetter = <GetterLogic>await ethers.getContractAt("GetterLogic", taskArguments.address);

    const balance = await humanboundTokenAsGetter.callStatic.balanceOf(taskArguments.user);

    console.log(`Balance of ${taskArguments.user}: ${balance}!`);
  });
