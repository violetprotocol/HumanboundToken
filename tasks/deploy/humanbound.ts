import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ContractReceipt, ContractTransaction, Signer } from "ethers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { ExtendLogic, Extension } from "../../src/types";
import { deploy, deployWithLedger } from "../helpers";

// Populate this config for your HumanboundToken deployment
const humanboundConfig = {
  name: "Humanbound Token",
  symbol: "HBT",
  extend: "0x75d98059da05DD2488706E11E629991B0fF272e3",
  permission: "0x0A3fA62ac17D62c8B494dA90A9C3f4f7c369b0d8",
  approve: "0xaf3D08525df81F8B663c938b4C7f2df228414495",
  getter: "0x62fc47d44FE3e956DecAa31E8205d09B763FF879",
  onreceive: "0x68202bDc0cf83aAe3a4775feb527Cbbf27375E0A",
  transfer: "0xb0Be194274d1Eba69565a058623c5CdA00B3FAc2",
  hooks: "0x9441123031563717582dFd8dEd514B4548c1410C",
  mint: "0x9f885FAF4897A6958B8d3579BE818fA4517D06DB",
  burn: "0xF910f3D06da42C052f52e335f3b8De757f2e13D7",
  tokenuri: "0x1Dd3028e8A7defeA09044eB9ADa0eC6B88c2bcc5",
  gasrefund: "0xD39E01C769D228B698C671896a76bEb6716Ec22E",
  eatverifierconnector: "0x242F15303bf19D239f44F56F87fdE4De0d6Da8d0",
};

const extend = async (humanboundAsExtend: ExtendLogic, extensionAddress: string, signer?: Signer) => {
  let tx: ContractTransaction;
  try {
    if (signer) {
      tx = await humanboundAsExtend.connect(signer).extend(extensionAddress);
    } else {
      tx = await humanboundAsExtend.extend(extensionAddress);
    }
  } catch (err) {
    console.error(`Failed to extend with ${extensionAddress}`);
    throw err;
  }

  try {
    const receipt: ContractReceipt = await tx.wait();
    if (receipt.status === 0) {
      throw new Error(
        `Error while extending with ${extensionAddress}, Transaction Reverted! Tx hash: ${receipt.transactionHash}`,
      );
    } else {
      console.log(`Successfully extended with ${extensionAddress}!`);
    }
  } catch (err) {
    console.error(err);
    throw new Error(`Error while extending with ${extensionAddress}`);
  }
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

  const humanboundTokenAsERC165 = <Extension>await ethers.getContractAt("Extension", humanboundToken.address);
  await humanboundTokenAsERC165.registerInterface("0x5b5e139f");

  const humanboundTokenAsExtend = <ExtendLogic>await ethers.getContractAt("ExtendLogic", humanboundToken.address);

  console.log(`Extending with Permission Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.permission);
  console.log(`Extending with Minting Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.mint);
  console.log(`Extending with Burn Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.burn);
  console.log(`Extending with Token URI Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.tokenuri);
  console.log(`Extending with Gas Refund Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.gasrefund);
  console.log(`Extending with EAT Verifier Connector Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.eatverifierconnector);

  console.log("HumanboundToken extended with all functionality!");
});

task("hd:deploy:humanboundtoken").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const ledger = new LedgerSigner(ethers.provider);

  const humanboundToken = await deployWithLedger(
    ledger,
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

  const humanboundTokenAsERC165 = <Extension>await ethers.getContractAt("Extension", humanboundToken.address);
  await humanboundTokenAsERC165.connect(ledger).registerInterface("0x5b5e139f");

  const humanboundTokenAsExtend = <ExtendLogic>await ethers.getContractAt("ExtendLogic", humanboundToken.address);

  console.log(`Extending with Permission Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.permission, ledger);
  console.log(`Extending with Minting Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.mint, ledger);
  console.log(`Extending with Burn Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.burn, ledger);
  console.log(`Extending with Token URI Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.tokenuri, ledger);
  console.log(`Extending with Gas Refund Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.gasrefund, ledger);
  console.log(`Extending with EAT Verifier Connector Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.eatverifierconnector, ledger);

  console.log("HumanboundToken extended with all functionality!");
});
