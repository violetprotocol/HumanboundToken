import { LedgerSigner } from "@anders-t/ethers-ledger";
import { task } from "hardhat/config";

import { deploy, deployWithLedger } from "../helpers";

task("deploy:all", "Deploys all extensions needed for Humanbound token").setAction(async function (
  taskArguments,
  { ethers },
) {
  let contract = await deploy(ethers, "HumanboundExtendLogic");
  console.log(`HumanboundExtendLogic deployed to: `, contract.address);

  contract = await deploy(ethers, "HumanboundPermissionLogic");
  console.log(`HumanboundPermissionLogic deployed to: `, contract.address);

  contract = await deploy(ethers, "ApproveLogic");
  console.log(`ApproveLogic deployed to: `, contract.address);

  contract = await deploy(ethers, "GetterLogic");
  console.log(`GetterLogic deployed to: `, contract.address);

  contract = await deploy(ethers, "OnReceiveLogic");
  console.log(`OnReceiveLogic deployed to: `, contract.address);

  contract = await deploy(ethers, "HumanboundTransferLogic");
  console.log(`HumanboundTransferLogic deployed to: `, contract.address);

  contract = await deploy(ethers, "ERC721HooksLogic");
  console.log(`ERC721HooksLogic deployed to: `, contract.address);

  contract = await deploy(ethers, "HumanboundMintLogic");
  console.log(`HumanboundMintLogic deployed to: `, contract.address);

  contract = await deploy(ethers, "HumanboundBurnLogic");
  console.log(`HumanboundBurnLogic deployed to: `, contract.address);

  contract = await deploy(ethers, "HumanboundTokenURILogic");
  console.log(`HumanboundTokenURILogic deployed to: `, contract.address);

  contract = await deploy(ethers, "GasRefundLogic");
  console.log(`GasRefundLogic deployed to: `, contract.address);

  contract = await deploy(ethers, "EATVerifierConnector");
  console.log(`EATVerifierConnector deployed to: `, contract.address);
});

task("hd:deploy:all", "Deploys all extensions needed for Humanbound token").setAction(async function (
  _taskArguments,
  { ethers, network },
) {
  const ledger = new LedgerSigner(ethers.provider);

  let contract = await deployWithLedger(ledger, network, ethers, "HumanboundExtendLogic");
  console.log(`HumanboundExtendLogic deployed to: `, contract.address);

  contract = await deployWithLedger(ledger, network, ethers, "HumanboundPermissionLogic");
  console.log(`HumanboundPermissionLogic deployed to: `, contract.address);

  contract = await deployWithLedger(ledger, network, ethers, "ApproveLogic");
  console.log(`ApproveLogic deployed to: `, contract.address);

  contract = await deployWithLedger(ledger, network, ethers, "GetterLogic");
  console.log(`GetterLogic deployed to: `, contract.address);

  contract = await deployWithLedger(ledger, network, ethers, "OnReceiveLogic");
  console.log(`OnReceiveLogic deployed to: `, contract.address);

  contract = await deployWithLedger(ledger, network, ethers, "HumanboundTransferLogic");
  console.log(`HumanboundTransferLogic deployed to: `, contract.address);

  contract = await deployWithLedger(ledger, network, ethers, "ERC721HooksLogic");
  console.log(`ERC721HooksLogic deployed to: `, contract.address);

  contract = await deployWithLedger(ledger, network, ethers, "HumanboundMintLogic");
  console.log(`HumanboundMintLogic deployed to: `, contract.address);

  contract = await deployWithLedger(ledger, network, ethers, "HumanboundBurnLogic");
  console.log(`HumanboundBurnLogic deployed to: `, contract.address);

  contract = await deployWithLedger(ledger, network, ethers, "HumanboundTokenURILogic");
  console.log(`HumanboundTokenURILogic deployed to: `, contract.address);

  contract = await deployWithLedger(ledger, network, ethers, "GasRefundLogic");
  console.log(`GasRefundLogic deployed to: `, contract.address);

  contract = await deployWithLedger(ledger, network, ethers, "EATVerifierConnector");
  console.log(`EATVerifierConnector deployed to: `, contract.address);
});
