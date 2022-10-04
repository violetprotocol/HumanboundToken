import { LedgerSigner } from "@anders-t/ethers-ledger";
import { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/types";
import { Contract, ContractFactory } from "ethers";
import { Network } from "hardhat/types";

import { calcGas } from "./utils";

export const deploy = async (ethers: HardhatEthersHelpers, artifact: string, ...params: Array<any>) => {
  const factory: ContractFactory = <ContractFactory>await ethers.getContractFactory(artifact);
  let contract: Contract;

  if (params) contract = await factory.deploy(...params);
  else contract = await factory.deploy();

  return await contract.deployed();
};

export const deployWithLedger = async (
  ledger: LedgerSigner,
  network: Network,
  ethers: HardhatEthersHelpers,
  artifact: string,
  constructorArgs: Array<any> = [],
) => {
  const factory: ContractFactory = <ContractFactory>await ethers.getContractFactory(artifact);
  let contract: Contract;
  const connectedFactory = await factory.connect(ledger);

  const estimatedGas = await ethers.provider.estimateGas(connectedFactory.getDeployTransaction(...constructorArgs));

  if (network.name !== "polygon") {
    if (constructorArgs)
      contract = await connectedFactory.deploy(...constructorArgs, { gasLimit: estimatedGas.mul(110).div(100) });
    else contract = await connectedFactory.deploy({ gasLimit: estimatedGas.mul(110).div(100) });

    return await contract.deployed();
  } else {
    // Gas estimation and gas fees settings for Polygon
    console.log("estimatedGas", estimatedGas);
    const gasParams = await calcGas(estimatedGas);
    const adjustedGasParams = {
      ...gasParams,
      maxFeePerGas: gasParams.maxFeePerGas,
      maxPriorityFeePerGas: gasParams.maxFeePerGas,
    };
    console.log("maxFeePerGas: ", adjustedGasParams.maxFeePerGas.toString());
    console.log("maxPriorityFeePerGas: ", adjustedGasParams.maxPriorityFeePerGas.toString());
    console.log("constructorArgs", constructorArgs);
    if (constructorArgs) contract = await connectedFactory.deploy(...constructorArgs, { ...adjustedGasParams });
    else contract = await connectedFactory.deploy({ ...adjustedGasParams });

    return await contract.deployed();
  }
};
