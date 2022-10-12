import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { HumanboundTokenURILogic } from "../../src/types";

task("humanboundtoken:getBaseURI")
  .addParam("address", "Contract address of HumanboundToken")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsTokenURI = <HumanboundTokenURILogic>(
      await ethers.getContractAt("HumanboundTokenURILogic", taskArguments.address)
    );

    const baseURI = await humanboundTokenAsTokenURI.callStatic.baseURI();

    console.log(`BaseURI: ${baseURI}`);
  });

task("humanboundtoken:setBaseURI")
  .addParam("address", "Contract address of HumanboundToken")
  .addParam("uri", "URI to set the BaseURI with")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsTokenURI = <HumanboundTokenURILogic>(
      await ethers.getContractAt("HumanboundTokenURILogic", taskArguments.address)
    );

    try {
      const tx = await humanboundTokenAsTokenURI.setBaseURI(taskArguments.uri);
      const receipt = await tx.wait();

      console.log(`BaseURI set!`);
      console.log(`Transaction: ${receipt.transactionHash}`);
    } catch (e) {
      console.log(e);
    }
  });

task("humanboundtoken:getTokenURI")
  .addParam("address", "Contract address of HumanboundToken")
  .addParam("id", "TokenID to check the tokenURI of")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsTokenURI = <HumanboundTokenURILogic>(
      await ethers.getContractAt("HumanboundTokenURILogic", taskArguments.address)
    );

    const uri = await humanboundTokenAsTokenURI.callStatic.tokenURI(taskArguments.id);

    console.log(`TokenURI of token ${taskArguments.id}: ${uri}!`);
  });

task("humanboundtoken:setTokenURI")
  .addParam("address", "Contract address of HumanboundToken")
  .addParam("id", "TokenID to check the owner of")
  .addParam("uri", "URI to set the specified token as", "")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsTokenURI = <HumanboundTokenURILogic>(
      await ethers.getContractAt("HumanboundTokenURILogic", taskArguments.address)
    );

    const tx = await humanboundTokenAsTokenURI.setTokenURI(taskArguments.id, taskArguments.uri);
    const receipt = await tx.wait();

    console.log(`TokenURI set!`);
    console.log(`Transaction: ${receipt.transactionHash}`);
  });

task("humanboundtoken:setContractURI")
  .addParam("address", "Contract address of HumanboundToken")
  .addParam("contracturi", "Contract URI to set")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsTokenURI = <HumanboundTokenURILogic>(
      await ethers.getContractAt("HumanboundTokenURILogic", taskArguments.address)
    );

    try {
      const tx = await humanboundTokenAsTokenURI.setContractURI(taskArguments.contracturi);
      const receipt = await tx.wait();

      console.log(`ContractURI set!`);
      console.log(`Transaction: ${receipt.transactionHash}`);
    } catch (e) {
      console.log(e);
    }
  });

task("humanboundtoken:getContractURI")
  .addParam("address", "Contract address of HumanboundToken")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsTokenURI = <HumanboundTokenURILogic>(
      await ethers.getContractAt("HumanboundTokenURILogic", taskArguments.address)
    );

    const contractURI = await humanboundTokenAsTokenURI.callStatic.contractURI();

    console.log(`Contract URI: ${contractURI}`);
  });
