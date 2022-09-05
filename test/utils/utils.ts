import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ContractTransaction, Event, utils } from "ethers";
import { ethers } from "hardhat";

import {
  erc165Bytecode,
  erc165DeploymentSalt,
  factoryABI,
  singletonFactoryAddress,
  singletonFactoryDeployer,
  singletonFactoryDeploymentTx,
} from "./constants";

const getExtendedContractWithInterface = async (address: string, interfaceName: string) => {
  const LogicInterface = await ethers.getContractFactory(interfaceName);
  return await LogicInterface.attach(address);
};

const expectEvent = async (
  tx: ContractTransaction,
  contractInterface: utils.Interface,
  eventName: string,
  params: any,
) => {
  const event = Object.keys(contractInterface.events).find(e => contractInterface.events[e].name == eventName);
  expect(event).to.not.be.undefined;

  const eventSig = utils.keccak256(utils.toUtf8Bytes(event as string));
  const receipt = await tx.wait();
  const found = receipt.events?.find(e => e.topics[0] == eventSig);
  expect(found).to.not.be.undefined;

  const decodedEvent = contractInterface.parseLog({
    topics: (found as Event).topics,
    data: (found as Event).data,
  });

  const eventParams = decodedEvent.args;

  const paramKeys = Object.keys(params);
  paramKeys.forEach(paramKey => {
    expect(params[paramKey]).to.equal(eventParams[paramKey]);
  });
};

// Extracted from @violetprotocol/extendable/test/utils.js
const deployERC165Singleton = async (deployer: SignerWithAddress) => {
  await deployer.sendTransaction({ to: singletonFactoryDeployer, value: ethers.utils.parseEther("1") });
  await ethers.provider.sendTransaction(singletonFactoryDeploymentTx);

  const Factory = new ethers.Contract("0x0000000000000000000000000000000000000000", factoryABI, deployer);
  const factory = await Factory.attach(singletonFactoryAddress);
  await factory.deploy(erc165Bytecode, erc165DeploymentSalt, { gasLimit: "0x07A120" });
};

export { getExtendedContractWithInterface, expectEvent, deployERC165Singleton };
