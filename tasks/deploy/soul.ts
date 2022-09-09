import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { ExtendLogic } from "../../src/types";
import { deploy } from "../helpers";

// Populate this config for your SoulToken deployment
const soulConfig = {
  name: "Soul Token",
  symbol: "SOUL",
  extend: "0x182E32209c5a5a857726911B93204F4228b61941",
  permission: "0xdA57594848b066b85dF38bA9d53f10402C76D494",
  approve: "0xd77C3840dE2C630bD503E812ddE73dA0d5e26A8F",
  getter: "0x0E5976eef68e09852d9c1757196271c8203e7C68",
  onreceive: "0xC7A69c9ef2fb491C0eD5238BB24F50A97Bd4799c",
  transfer: "0x75f815B5E42BF00992443a356C7e3C082E5a40d4",
  hooks: "0x8D3891378FC5e1551054A9dEa93603ad308a6D09",
  mint: "0x2cB39a40a37d025F20A0282553d58f723b62D845",
  burn: "0xEed9A8A6B32204Bd158Fe4C99BD25AD84E97b8ED",
  tokenuri: "0x25EAff0804c008c4226e17159a38A1515d929CCd",
  eatverifierconnector: "0x880058Ba98E914760545fedfe8C52a8EAb3054Ab",
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
  console.log(await soulTokenAsExtend.extend(soulConfig.permission));
  console.log(await soulTokenAsExtend.extend(soulConfig.mint));
  console.log(await soulTokenAsExtend.extend(soulConfig.burn));
  console.log(await soulTokenAsExtend.extend(soulConfig.tokenuri));
  console.log(await soulTokenAsExtend.extend(soulConfig.eatverifierconnector));

  console.log("SoulToken extended with all functionality!");
});
