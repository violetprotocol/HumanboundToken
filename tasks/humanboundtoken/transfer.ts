import { splitSignature } from "@ethersproject/bytes";
import { AccessTokenStruct } from "@violetprotocol/ethereum-access-token-helpers/dist/types/IAccessTokenVerifier";
import { packParameters, signAccessToken } from "@violetprotocol/ethereum-access-token-helpers/dist/utils";
import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { EATVerifierConnector, HumanboundTransferLogic } from "../../src/types";

task("humanboundtoken:transfer")
  .addParam("address", "Contract address of HumanboundToken")
  .addParam("to", "Recipient address of the token to be transferred")
  .addParam("id", "TokenID of the token being transferred")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsEATVerifierConnector = <EATVerifierConnector>(
      await ethers.getContractAt("EATVerifierConnector", taskArguments.address)
    );
    const verifier = await humanboundTokenAsEATVerifierConnector.callStatic.getVerifier();

    const humanboundTokenAsTransfer = <HumanboundTransferLogic>(
      await ethers.getContractAt("HumanboundTransferLogic", taskArguments.address)
    );

    const signers = await ethers.getSigners();

    console.log("Generating Ethereum Access Token...");
    const domain = {
      name: "Ethereum Access Token",
      version: "1",
      chainId: await signers[0].getChainId(),
      verifyingContract: verifier,
    };

    const accessToken: AccessTokenStruct = {
      expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 120),
      functionCall: {
        functionSignature: humanboundTokenAsTransfer.interface.getSighash(
          "transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
        ),
        target: humanboundTokenAsTransfer.address.toLowerCase(),
        caller: signers[0].address,
        parameters: packParameters(
          humanboundTokenAsTransfer.interface,
          "transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
          [signers[0].address, taskArguments.to, taskArguments.id],
        ),
      },
    };

    console.log("Signing Access Token...");
    const signature = splitSignature(await signAccessToken(signers[0], domain, accessToken));

    console.log("Transferring...");
    try {
      const tx = await humanboundTokenAsTransfer["transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
        signature.v,
        signature.r,
        signature.s,
        accessToken.expiry,
        signers[0].address,
        taskArguments.to,
        taskArguments.id,
      );
      const receipt = await tx.wait();

      console.log(
        `Humanbound token ${taskArguments.id} transferred from ${signers[0].address} to ${taskArguments.to}!`,
      );
      console.log(`Transaction: ${receipt.transactionHash}`);
    } catch (e) {
      console.log(e);
    }
  });
