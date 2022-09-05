import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import type {
  AccessTokenVerifier,
  EATVerifierConnector,
  ExtendLogic,
  RequiresAuthExtension,
  SoulExtendLogic,
} from "../../src/types";
import { Signers } from "../types";
import { deployERC165Singleton } from "../utils/utils";
import { shouldBehaveLikeSoulPermissioning } from "./Permission.behavior";

describe("SoulPermission Extension", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.owner = signers[1];
    this.signers.operator = signers[2];
    this.signers.user0 = signers[3];
    this.signers.user1 = signers[4];

    await deployERC165Singleton(this.signers.admin);

    const extendArtifact: Artifact = await artifacts.readArtifact("SoulExtendLogic");
    this.extend = <SoulExtendLogic>await waffle.deployContract(this.signers.admin, extendArtifact, []);
  });

  shouldBehaveLikeSoulPermissioning();
});
