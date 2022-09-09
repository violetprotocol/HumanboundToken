import { splitSignature } from "@ethersproject/bytes";
import { AccessTokenStruct } from "@violetprotocol/ethereum-access-token-helpers/dist/types/IAccessTokenVerifier";
import { packParameters, signAccessToken } from "@violetprotocol/ethereum-access-token-helpers/dist/utils";
import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { EATVerifierConnector, HumanboundMintLogic } from "../../src/types";

task("humanboundtoken:mint")
  .addParam("address", "Contract address of HumanboundToken")
  .addParam("to", "Recipient address of the token to be minted")
  .addParam("id", "TokenID of the token being minted")
  .addParam("tokenuri", "TokenURI resource link that contains the token metadata", "")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const humanboundTokenAsEATVerifierConnector = <EATVerifierConnector>(
      await ethers.getContractAt("EATVerifierConnector", taskArguments.address)
    );
    const verifier = await humanboundTokenAsEATVerifierConnector.callStatic.getVerifier();

    const humanboundTokenAsMint = <HumanboundMintLogic>(
      await ethers.getContractAt("HumanboundMintLogic", taskArguments.address)
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
        functionSignature: humanboundTokenAsMint.interface.getSighash("mint"),
        target: humanboundTokenAsMint.address.toLowerCase(),
        caller: signers[0].address,
        parameters: packParameters(humanboundTokenAsMint.interface, "mint", [
          taskArguments.to,
          taskArguments.id,
          taskArguments.tokenuri,
        ]),
      },
    };

    console.log("Signing Access Token...");
    const signature = splitSignature(await signAccessToken(signers[0], domain, accessToken));

    console.log("Minting...");
    const tx = await humanboundTokenAsMint.mint(
      signature.v,
      signature.r,
      signature.s,
      accessToken.expiry,
      taskArguments.to,
      taskArguments.id,
      taskArguments.tokenuri,
    );
    const receipt = await tx.wait();

    console.log(`Humanbound token ${taskArguments.id} minted to ${taskArguments.to}!`);
    console.log(`Transaction: ${receipt.transactionHash}`);
  });
