import { splitSignature } from "@ethersproject/bytes";
import { AccessTokenStruct } from "@violetprotocol/ethereum-access-token-helpers/dist/types/IAccessTokenVerifier";
import { packParameters, signAccessToken } from "@violetprotocol/ethereum-access-token-helpers/dist/utils";
import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { EATVerifier, SoulMintLogic } from "../../src/types";

task("soul:Mint")
  .addParam("address", "Contract address of SoulToken")
  .addParam("to", "Recipient address of the token to be minted")
  .addParam("id", "TokenID of the token being minted")
  .addParam("tokenuri", "TokenURI resource link that contains the token metadata", "")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const soulTokenAsEATVerifier = <EATVerifier>await ethers.getContractAt("EATVerifier", taskArguments.address);
    const verifier = await soulTokenAsEATVerifier.callStatic.getVerifier();

    const soulTokenAsMint = <SoulMintLogic>await ethers.getContractAt("SoulMintLogic", taskArguments.address);

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
        functionSignature: soulTokenAsMint.interface.getSighash("mint"),
        target: soulTokenAsMint.address.toLowerCase(),
        caller: signers[0].address,
        parameters: packParameters(soulTokenAsMint.interface, "mint", [
          taskArguments.to,
          taskArguments.id,
          taskArguments.tokenuri,
        ]),
      },
    };

    console.log("Signing Access Token...");
    const signature = splitSignature(await signAccessToken(signers[0], domain, accessToken));

    console.log("Minting...");
    const tx = await soulTokenAsMint.mint(
      signature.v,
      signature.r,
      signature.s,
      accessToken.expiry,
      taskArguments.to,
      taskArguments.id,
      taskArguments.tokenuri,
    );
    const receipt = await tx.wait();

    console.log(`Soul token ${taskArguments.id} minted to ${taskArguments.to}!`);
    console.log(`Transaction: ${receipt.transactionHash}`);
  });
