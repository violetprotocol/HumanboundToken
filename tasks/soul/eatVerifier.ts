import { splitSignature } from "@ethersproject/bytes";
import { Domain } from "@violetprotocol/ethereum-access-token-helpers/dist/messages";
import { AccessTokenStruct } from "@violetprotocol/ethereum-access-token-helpers/dist/types/IAccessTokenVerifier";
import { packParameters, signAccessToken } from "@violetprotocol/ethereum-access-token-helpers/dist/utils";
import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { EATVerifier, ExtendLogic, SoulMintLogic } from "../../src/types";

task("soul:Verifier:set")
  .addParam("address", "Contract address of SoulToken")
  .addParam("verifier", "Contract address of SoulToken")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsEATVerifier = <EATVerifier>await ethers.getContractAt("EATVerifier", taskArguments.address);

    const tx = await soulTokenAsEATVerifier.setVerifier(taskArguments.verifier);
    const receipt = await tx.wait();

    console.log(`Transaction: ${receipt.transactionHash}`);
  });

task("soul:Verifier:get")
  .addParam("address", "Contract address of SoulToken")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsEATVerifier = <EATVerifier>await ethers.getContractAt("EATVerifier", taskArguments.address);

    const verifier = await soulTokenAsEATVerifier.callStatic.getVerifier();

    console.log(`AccessTokenVerifier connected: ${verifier}`);
  });
