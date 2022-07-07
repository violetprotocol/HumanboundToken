import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { SoulTokenURILogic } from "../../src/types";

task("soul:URI:getBaseURI")
  .addParam("address", "Contract address of SoulToken")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsTokenURI = <SoulTokenURILogic>(
      await ethers.getContractAt("SoulTokenURILogic", taskArguments.address)
    );

    const baseURI = await soulTokenAsTokenURI.callStatic.baseURI();

    console.log(`BaseURI: ${baseURI}`);
  });

task("soul:URI:setBaseURI")
  .addParam("address", "Contract address of SoulToken")
  .addParam("uri", "URI to set the BaseURI with")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsTokenURI = <SoulTokenURILogic>(
      await ethers.getContractAt("SoulTokenURILogic", taskArguments.address)
    );

    try {
      const tx = await soulTokenAsTokenURI.setBaseURI(taskArguments.uri);
      const receipt = await tx.wait();

      console.log(`BaseURI set!`);
      console.log(`Transaction: ${receipt.transactionHash}`);
    } catch (e) {
      console.log(e);
    }
  });

task("soul:URI:getTokenURI")
  .addParam("address", "Contract address of SoulToken")
  .addParam("id", "TokenID to check the tokenURI of")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsTokenURI = <SoulTokenURILogic>(
      await ethers.getContractAt("SoulTokenURILogic", taskArguments.address)
    );

    const uri = await soulTokenAsTokenURI.callStatic.tokenURI(taskArguments.id);

    console.log(`TokenURI of token ${taskArguments.id}: ${uri}!`);
  });

task("soul:URI:setTokenURI")
  .addParam("address", "Contract address of SoulToken")
  .addParam("id", "TokenID to check the owner of")
  .addParam("uri", "URI to set the specified token as", "")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsTokenURI = <SoulTokenURILogic>(
      await ethers.getContractAt("SoulTokenURILogic", taskArguments.address)
    );

    const tx = await soulTokenAsTokenURI.setTokenURI(taskArguments.id, taskArguments.uri);
    const receipt = await tx.wait();

    console.log(`Set TokenURI!`);
    console.log(`Transaction: ${receipt.transactionHash}`);
  });
