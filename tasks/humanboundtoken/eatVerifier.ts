import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { EATVerifierConnector } from "../../src/types";

task("humanboundtoken:setVerifier")
  .addParam("address", "Contract address of HumanboundToken")
  .addParam("verifier", "Address of the AccessTokenVerifier contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsEATVerifierConnector = <EATVerifierConnector>(
      await ethers.getContractAt("EATVerifierConnector", taskArguments.address)
    );

    const tx = await humanboundTokenAsEATVerifierConnector.setVerifier(taskArguments.verifier);
    const receipt = await tx.wait();

    console.log(`Transaction: ${receipt.transactionHash}`);
  });

task("humanboundtoken:getVerifier")
  .addParam("address", "Contract address of HumanboundToken")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsEATVerifierConnector = <EATVerifierConnector>(
      await ethers.getContractAt("EATVerifierConnector", taskArguments.address)
    );

    const verifier = await humanboundTokenAsEATVerifierConnector.callStatic.getVerifier();

    console.log(`AccessTokenVerifier connected: ${verifier}`);
  });
