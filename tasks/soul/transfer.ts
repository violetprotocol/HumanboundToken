import { splitSignature } from "@ethersproject/bytes";
import { Domain } from "@violetprotocol/ethereum-access-token-helpers/dist/messages";
import { AccessTokenStruct } from "@violetprotocol/ethereum-access-token-helpers/dist/types/IAccessTokenVerifier";
import { packParameters, signAccessToken } from "@violetprotocol/ethereum-access-token-helpers/dist/utils";
import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { EATVerifier, SoulTransferLogic } from "../../src/types";

task("soul:Transfer")
  .addParam("address", "Contract address of SoulToken")
  .addParam("to", "Recipient address of the token to be minted")
  .addParam("id", "TokenID of the token being minted")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsEATVerifier = <EATVerifier>await ethers.getContractAt("EATVerifier", taskArguments.address);
    const verifier = await soulTokenAsEATVerifier.callStatic.getVerifier();

    const soulTokenAsTransfer = <SoulTransferLogic>(
      await ethers.getContractAt("SoulTransferLogic", taskArguments.address)
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
        functionSignature: soulTokenAsTransfer.interface.getSighash(
          "transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
        ),
        target: soulTokenAsTransfer.address.toLowerCase(),
        caller: signers[0].address,
        parameters: packParameters(
          soulTokenAsTransfer.interface,
          "transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
          [signers[0].address, taskArguments.to, taskArguments.id],
        ),
      },
    };

    console.log("Signing Access Token...");
    const signature = splitSignature(await signAccessToken(signers[0], domain, accessToken));

    console.log("Transferring...");
    const tx = await soulTokenAsTransfer["transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
      signature.v,
      signature.r,
      signature.s,
      accessToken.expiry,
      signers[0].address,
      taskArguments.to,
      taskArguments.id,
    );
    const receipt = await tx.wait();

    console.log(`Soul token ${taskArguments.id} transferred from ${signers[0].address} to ${taskArguments.to}!`);
    console.log(`Transaction: ${receipt.transactionHash}`);
  });
