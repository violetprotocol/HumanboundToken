import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import type { AuthVerifier, EATVerifier, ExtendLogic, RequiresAuthExtension } from "../../src/types";
import { Signers } from "../types";
import { shouldBehaveLikeEthereumAccessToken } from "./AccessTokenConsumer.behavior";

describe("Ethereum Access Token Extension", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.user0 = signers[1];
    this.signers.user1 = signers[2];

    const extendArtifact: Artifact = await artifacts.readArtifact("ExtendLogic");
    this.extend = <ExtendLogic>await waffle.deployContract(this.signers.admin, extendArtifact, []);

    const verifierArtifact: Artifact = await artifacts.readArtifact("AuthVerifier");
    this.verifier = <AuthVerifier>(
      await waffle.deployContract(this.signers.admin, verifierArtifact, [this.signers.admin.address])
    );
    await this.verifier.rotateIntermediate(this.signers.admin.address);
    await this.verifier.rotateIssuer(this.signers.admin.address);

    const EATVerifierArtifact: Artifact = await artifacts.readArtifact("EATVerifier");
    this.verifierExtension = <EATVerifier>await waffle.deployContract(this.signers.admin, EATVerifierArtifact);

    const requiresAuthArtifact: Artifact = await artifacts.readArtifact("RequiresAuthExtension");
    this.requiresAuth = <RequiresAuthExtension>await waffle.deployContract(this.signers.admin, requiresAuthArtifact);

    this.domain = {
      name: "Ethereum Access Token",
      version: "1",
      chainId: await this.signers.admin.getChainId(),
      verifyingContract: this.verifier.address,
    };
  });

  shouldBehaveLikeEthereumAccessToken();
});
