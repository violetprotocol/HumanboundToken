import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import type {
  AccessTokenVerifier,
  EATVerifierConnector,
  HumanboundExtendLogic,
  HumanboundMintLogicWithRefund,
} from "../../src/types";
import { Signers } from "../types";
import { shouldBehaveLikeHumanboundMint } from "./Mint.behavior";

describe("Humanbound Mint Extension", function () {
  before(async function () {
    const extendArtifact: Artifact = await artifacts.readArtifact("HumanboundExtendLogic");
    this.extend = <HumanboundExtendLogic>await waffle.deployContract(this.signers.admin, extendArtifact, []);

    const verifierArtifact: Artifact = await artifacts.readArtifact("AccessTokenVerifier");
    this.verifier = <AccessTokenVerifier>(
      await waffle.deployContract(this.signers.admin, verifierArtifact, [this.signers.admin.address])
    );
    await this.verifier.rotateIntermediate(this.signers.admin.address);
    await this.verifier.rotateIssuer(this.signers.admin.address);

    const EATVerifierConnectorArtifact: Artifact = await artifacts.readArtifact("EATVerifierConnector");
    this.verifierExtension = <EATVerifierConnector>(
      await waffle.deployContract(this.signers.admin, EATVerifierConnectorArtifact)
    );

    const mintArtifact: Artifact = await artifacts.readArtifact("HumanboundMintLogicWithRefund");
    this.mintLogic = <HumanboundMintLogicWithRefund>await waffle.deployContract(this.signers.admin, mintArtifact);

    this.domain = {
      name: "Ethereum Access Token",
      version: "1",
      chainId: await this.signers.admin.getChainId(),
      verifyingContract: this.verifier.address,
    };
  });

  shouldBehaveLikeHumanboundMint();
});
