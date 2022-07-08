import { splitSignature } from "@ethersproject/bytes";
import { Domain } from "@violetprotocol/ethereum-access-token-helpers/dist/messages";
import { AccessTokenStruct } from "@violetprotocol/ethereum-access-token-helpers/dist/types/IAccessTokenVerifier";
import { packParameters, signAccessToken } from "@violetprotocol/ethereum-access-token-helpers/dist/utils";
import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { GetterLogic } from "../../src/types";

task("soultoken:ownerOf")
  .addParam("address", "Contract address of SoulToken")
  .addParam("id", "TokenID to check the owner of")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsGetter = <GetterLogic>await ethers.getContractAt("GetterLogic", taskArguments.address);

    const owner = await soulTokenAsGetter.callStatic.ownerOf(taskArguments.id);

    console.log(`Owner of token ${taskArguments.id}: ${owner}!`);
  });

task("soultoken:balanceOf")
  .addParam("address", "Contract address of SoulToken")
  .addParam("user", "User address to check the balance of")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsGetter = <GetterLogic>await ethers.getContractAt("GetterLogic", taskArguments.address);

    const balance = await soulTokenAsGetter.callStatic.balanceOf(taskArguments.user);

    console.log(`Balance of ${taskArguments.user}: ${balance}!`);
  });
