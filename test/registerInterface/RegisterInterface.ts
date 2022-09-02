import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import type { ExtendLogic } from "../../src/types";
import { Signers } from "../types";
import { shouldBehaveLikeRegisterInterface } from "./RegisterInterface.behavior";

describe("RegisterInterface Extension", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.user0 = signers[1];
    this.signers.user1 = signers[2];

    const extendArtifact: Artifact = await artifacts.readArtifact("ExtendLogic");
    this.extend = <ExtendLogic>await waffle.deployContract(this.signers.admin, extendArtifact, []);
  });

  shouldBehaveLikeRegisterInterface();
});
