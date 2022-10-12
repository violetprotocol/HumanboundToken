import { artifacts, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import type { HumanboundExtendLogic } from "../../src/types";
import { shouldBehaveLikeHumanboundRetract } from "./Retract.behavior";

describe("Humanbound Retract Extension", function () {
  before(async function () {
    const extendArtifact: Artifact = await artifacts.readArtifact("HumanboundExtendLogic");
    this.extend = <HumanboundExtendLogic>await waffle.deployContract(this.signers.admin, extendArtifact, []);
  });

  shouldBehaveLikeHumanboundRetract();
});
