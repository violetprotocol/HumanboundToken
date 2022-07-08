import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { EATVerifierConnector } from "../../src/types";

task("soultoken:setVerifier")
  .addParam("address", "Contract address of SoulToken")
  .addParam("verifier", "Address of the AccessTokenVerifier contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsEATVerifierConnector = <EATVerifierConnector>(
      await ethers.getContractAt("EATVerifierConnector", taskArguments.address)
    );

    const tx = await soulTokenAsEATVerifierConnector.setVerifier(taskArguments.verifier);
    const receipt = await tx.wait();

    console.log(`Transaction: ${receipt.transactionHash}`);
  });

task("soultoken:getVerifier")
  .addParam("address", "Contract address of SoulToken")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsEATVerifierConnector = <EATVerifierConnector>(
      await ethers.getContractAt("EATVerifierConnector", taskArguments.address)
    );

    const verifier = await soulTokenAsEATVerifierConnector.callStatic.getVerifier();

    console.log(`AccessTokenVerifier connected: ${verifier}`);
  });
