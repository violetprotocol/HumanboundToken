import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { ExtendLogic } from "../../src/types";
import { deploy } from "../helpers";

// Populate this config for your HumanboundToken deployment
const humanboundConfig = {
  name: "Humanbound Token",
  symbol: "HBT",
  extend: "0x9521C3596A20Ea196f9f391F03f182BaB4e0ca3D",
  permission: "0xC9AfC2a45D9F58356CcDF01Fa5F7e9Cee23763E1",
  approve: "0x4ea1A7512cdF67dE7F76034a8b1B483A67154Cc7",
  getter: "0xf93C6c23d8968d255946C916f46732797e76236e",
  onreceive: "0x079Fa8A293A925cd60C47DF3C1e01C63F51f5E45",
  transfer: "0x25e29De8E4e14Ff44a5380995340e9aBe087b3ef",
  hooks: "0xFd01d0ce486a125F358fc1b2AaC6073ae51444E8",
  mint: "0x71d743C76f3F37a476eAD5D730430628B1f5F1F9",
  burn: "0x52759d249e234749F86F3A4663b8e662B2a1176C",
  tokenuri: "0x596724AeAA60765654FF8a064aaaB034Fc84860C",
  gasrefund: "0xD55e09ce5a88F034f70A94804894E3D5de7433bA",
  eatverifierconnector: "0xA255aE2E449c44E843A0A30F3e1e06CA33bE6FA5",
};

task("deploy:humanboundtoken").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const humanboundToken = await deploy(
    ethers,
    "HumanboundToken",
    humanboundConfig.name,
    humanboundConfig.symbol,
    humanboundConfig.extend,
    humanboundConfig.approve,
    humanboundConfig.getter,
    humanboundConfig.onreceive,
    humanboundConfig.transfer,
    humanboundConfig.hooks,
  );
  console.log("HumanboundToken deployed to: ", humanboundToken.address);

  const humanboundTokenAsExtend = <ExtendLogic>await ethers.getContractAt("ExtendLogic", humanboundToken.address);
  console.log(await (await humanboundTokenAsExtend.extend(humanboundConfig.permission)).wait());
  console.log(await (await humanboundTokenAsExtend.extend(humanboundConfig.mint)).wait());
  console.log(await (await humanboundTokenAsExtend.extend(humanboundConfig.burn)).wait());
  console.log(await (await humanboundTokenAsExtend.extend(humanboundConfig.tokenuri)).wait());
  console.log(await (await humanboundTokenAsExtend.extend(humanboundConfig.gasrefund)).wait());
  console.log(await (await humanboundTokenAsExtend.extend(humanboundConfig.eatverifierconnector)).wait());

  console.log("HumanboundToken extended with all functionality!");
});

// const extend = async (humanboundContract: ExtendLogic, extension: string) => {
//   let try: number = 0;

//   const humanboundTokenAsExtend = <ExtendLogic>await ethers.getContractAt("ExtendLogic", humanboundToken.address);
// }
