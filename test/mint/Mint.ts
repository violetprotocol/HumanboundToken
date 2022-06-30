import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import type {
  AccessTokenVerifier,
  EATVerifier,
  ExtendLogic,
  MintLogic,
  RequiresAuthExtension,
  SoulMintLogic,
} from "../../src/types";
import { Signers } from "../types";
import { shouldBehaveLikeSoulMint } from "./Mint.behavior";

describe("Mint", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.user0 = signers[1];
    this.signers.user1 = signers[2];

    const extendArtifact: Artifact = await artifacts.readArtifact("ExtendLogic");
    this.extend = <ExtendLogic>await waffle.deployContract(this.signers.admin, extendArtifact, []);

    const verifierArtifact: Artifact = await artifacts.readArtifact("AccessTokenVerifier");
    this.verifier = <AccessTokenVerifier>(
      await waffle.deployContract(this.signers.admin, verifierArtifact, [this.signers.admin.address])
    );
    await this.verifier.rotateIntermediate(this.signers.admin.address);
    await this.verifier.rotateIssuer(this.signers.admin.address);

    const EATVerifierArtifact: Artifact = await artifacts.readArtifact("EATVerifier");
    this.verifierExtension = <EATVerifier>await waffle.deployContract(this.signers.admin, EATVerifierArtifact);

    const mintArtifact: Artifact = await artifacts.readArtifact("SoulMintLogic");
    this.mintLogic = <SoulMintLogic>await waffle.deployContract(this.signers.admin, mintArtifact);

    this.domain = {
      name: "Ethereum Access Token",
      version: "1",
      chainId: await this.signers.admin.getChainId(),
      verifyingContract: this.verifier.address,
    };
  });

  shouldBehaveLikeSoulMint();
});
