import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import type {
  AccessTokenVerifier,
  EATVerifierConnector,
  HumanboundExtendLogic,
  RequiresAuthExtension,
} from "../../src/types";
import { shouldBehaveLikeEthereumAccessToken } from "./AccessTokenConsumer.behavior";

describe("Ethereum Access Token Extension", function () {
  before(async function () {
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
