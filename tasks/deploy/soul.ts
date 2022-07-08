import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { ExtendLogic } from "../../src/types";
import { deploy } from "../helpers";

// Populate this config for your SoulToken deployment
const soulConfig = {
  name: "Soul Token",
  symbol: "SOUL",
  extend: "",
  approve: "",
  getter: "",
  onreceive: "",
  transfer: "",
  hooks: "",
  mint: "",
  burn: "",
  tokenuri: "",
  eatverifierconnector: "",
};

task("deploy:soultoken").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const soulToken = await deploy(
    ethers,
    "SoulToken",
    soulConfig.name,
    soulConfig.symbol,
    soulConfig.extend,
    soulConfig.approve,
    soulConfig.getter,
    soulConfig.onreceive,
    soulConfig.transfer,
    soulConfig.hooks,
  );
  console.log("SoulToken deployed to: ", soulToken.address);

  const soulTokenAsExtend = <ExtendLogic>await ethers.getContractAt("ExtendLogic", soulToken.address);
  await soulTokenAsExtend.extend(soulConfig.mint);
  await soulTokenAsExtend.extend(soulConfig.burn);
  await soulTokenAsExtend.extend(soulConfig.tokenuri);
  await soulTokenAsExtend.extend(soulConfig.eatverifierconnector);

  console.log("SoulToken extended with all functionality!");
});
