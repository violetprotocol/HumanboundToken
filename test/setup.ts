import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import { HumanboundExtendLogic, HumanboundPermissionLogic } from "../src/types";
import { Signers } from "./types";
import { deployERC165Singleton } from "./utils/utils";

before("setup", async function () {
  it("Deploy ERC165 Singleton", async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.owner = signers[1];
    this.signers.operator = signers[2];
    this.signers.user0 = signers[3];
    this.signers.user1 = signers[4];
    this.signers.user2 = signers[5];
    this.signers.user3 = signers[6];

    await deployERC165Singleton(this.signers.admin);
  });

  it("deploy extensions", async function () {
    const extendArtifact: Artifact = await artifacts.readArtifact("HumanboundExtendLogic");
    this.extend = <HumanboundExtendLogic>await waffle.deployContract(this.signers.admin, extendArtifact, []);

    const permissionArtifact: Artifact = await artifacts.readArtifact("HumanboundPermissionLogic");
    this.permissioning = <HumanboundPermissionLogic>(
      await waffle.deployContract(this.signers.admin, permissionArtifact, [])
    );
  });
});
