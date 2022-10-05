import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ContractReceipt, ContractTransaction, Signer } from "ethers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { ExtendLogic, Extension } from "../../src/types";
import { deploy, deployWithLedger } from "../helpers";
import { calcGas } from "../utils";

// Populate this config for your HumanboundToken deployment
const humanboundConfig = {
  name: "Humanbound Token",
  symbol: "HBT",
  extend: "",
  permission: "",
  approve: "",
  getter: "",
  onreceive: "",
  transfer: "",
  hooks: "",
  mint: "",
  burn: "",
  tokenuri: "",
  gasrefund: "",
  eatverifierconnector: "",
};

const extend = async (
  humanboundAsExtend: ExtendLogic,
  extensionAddress: string,
  estimateGas: boolean,
  signer?: Signer,
) => {
  let tx: ContractTransaction;
  try {
    if (signer && estimateGas) {
      const estimatedGas = await humanboundAsExtend.connect(signer).estimateGas.extend(extensionAddress);
      console.log("estimatedGas", estimatedGas);
      const gasParams = await calcGas(estimatedGas);
      console.log("maxFeePerGas: ", gasParams.maxFeePerGas.toString());
      console.log("maxPriorityFeePerGas: ", gasParams.maxPriorityFeePerGas.toString());
      tx = await humanboundAsExtend.connect(signer).extend(extensionAddress, { ...gasParams });
    } else if (signer) {
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
  await extend(humanboundTokenAsExtend, humanboundConfig.permission, false);
  console.log(`Extending with Minting Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.mint, false);
  console.log(`Extending with Burn Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.burn, false);
  console.log(`Extending with Token URI Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.tokenuri, false);
  console.log(`Extending with Gas Refund Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.gasrefund, false);
  console.log(`Extending with EAT Verifier Connector Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.eatverifierconnector, false);

  console.log("HumanboundToken extended with all functionality!");
});

task("hd:deploy:humanboundtoken").setAction(async function (taskArguments: TaskArguments, { ethers, network }) {
  const ledger = new LedgerSigner(ethers.provider);
  if (!ledger.provider) throw new Error("missing provider on LedgerSigner");
  console.log("Deploying Humanbound Token...");
  const humanboundToken = await deployWithLedger(ledger, network, ethers, "HumanboundToken", [
    humanboundConfig.name,
    humanboundConfig.symbol,
    humanboundConfig.extend,
    humanboundConfig.approve,
    humanboundConfig.getter,
    humanboundConfig.onreceive,
    humanboundConfig.transfer,
    humanboundConfig.hooks,
  ]);
  console.log("HumanboundToken deployed to: ", humanboundToken.address);

  const humanboundTokenAsERC165 = <Extension>await ethers.getContractAt("Extension", humanboundToken.address);
  await humanboundTokenAsERC165.connect(ledger).registerInterface("0x5b5e139f");
  console.log("Humanbound Token interface registered.");

  const humanboundTokenAsExtend = <ExtendLogic>await ethers.getContractAt("ExtendLogic", humanboundToken.address);

  console.log(`Extending with Permission Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.permission, false, ledger);
  console.log(`Extending with Minting Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.mint, false, ledger);
  console.log(`Extending with Burn Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.burn, false, ledger);
  console.log(`Extending with Token URI Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.tokenuri, false, ledger);
  console.log(`Extending with Gas Refund Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.gasrefund, false, ledger);
  console.log(`Extending with EAT Verifier Connector Logic...`);
  await extend(humanboundTokenAsExtend, humanboundConfig.eatverifierconnector, false, ledger);

  console.log("HumanboundToken extended with all functionality!");
});
