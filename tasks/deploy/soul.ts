import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { ExtendLogic } from "../../src/types";
import { deploy } from "../helpers";

task("deploy:Soul")
  .addParam("name", "Name to give your ERC721 token")
  .addParam("symbol", "Symbol for your ERC721 token")
  .addParam("extend", "Extend Logic address")
  .addParam("approve", "Approve Logic address")
  .addParam("getter", "Base Getter Logic address")
  .addParam("onreceive", "onReceive Logic address")
  .addParam("transfer", "SoulTransfer Logic address")
  .addParam("hooks", "Hooks Logic address")
  .addParam("mint", "SoulMint Logic address")
  .addParam("burn", "SoulBurn Logic address")
  .addParam("tokenuri", "SoulTokenURI Logic address")
  .addParam("eatverifier", "EATVerifier Logic address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulToken = await deploy(
      ethers,
      "SoulToken",
      taskArguments.name,
      taskArguments.symbol,
      taskArguments.extend,
      taskArguments.approve,
      taskArguments.getter,
      taskArguments.onreceive,
      taskArguments.transfer,
      taskArguments.hooks,
    );
    console.log("SoulToken deployed to: ", soulToken.address);

    const soulTokenAsExtend = <ExtendLogic>await ethers.getContractAt("ExtendLogic", soulToken.address);
    await soulTokenAsExtend.extend(taskArguments.mint);
    await soulTokenAsExtend.extend(taskArguments.burn);
    await soulTokenAsExtend.extend(taskArguments.tokenuri);
    await soulTokenAsExtend.extend(taskArguments.eatverifier);

    console.log("SoulToken extended with all functionality!");
  });
