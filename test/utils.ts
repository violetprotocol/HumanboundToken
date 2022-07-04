import { ethers } from "hardhat";

const getExtendedContractWithInterface = async (address: string, interfaceName: string) => {
  const LogicInterface = await ethers.getContractFactory(interfaceName);
  return await LogicInterface.attach(address);
};

export { getExtendedContractWithInterface };
