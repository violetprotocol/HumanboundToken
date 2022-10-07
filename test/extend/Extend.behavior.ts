import { splitSignature } from "@ethersproject/bytes";
import { utils } from "@violetprotocol/ethereum-access-token-helpers";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import {
  Extendable,
  HumanboundExtendLogic,
  HumanboundPermissionLogic,
  MockInternalExtend,
  MockOnReceive,
} from "../../src/types";
import { getExtendedContractWithInterface } from "../utils/utils";

export function shouldBehaveLikeHumanboundExtend(): void {
  let extendableAsExtend: HumanboundExtendLogic;

  beforeEach("setup", async function () {
    const extendableArtifact: Artifact = await artifacts.readArtifact("Extendable");
    this.extendable = <Extendable>(
      await waffle.deployContract(this.signers.owner, extendableArtifact, [this.extend.address])
    );

    const mockInternalExtendArtifact: Artifact = await artifacts.readArtifact("MockInternalExtend");
    const mockInternalExtend = <MockInternalExtend>(
      await waffle.deployContract(this.signers.admin, mockInternalExtendArtifact, [])
    );

    extendableAsExtend = <HumanboundExtendLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "ExtendLogic")
    );
    await extendableAsExtend.connect(this.signers.owner).extend(this.permissioning.address);

    const permission = <HumanboundPermissionLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundPermissionLogic")
    );
    await permission.connect(this.signers.owner).updateOperator(this.signers.operator.address);

    await extendableAsExtend.connect(this.signers.operator).extend(mockInternalExtend.address);
  });

  describe("Extend", async () => {
    context("extend", async function () {
      context("as operator", async function () {
        it("should succeed", async function () {
          const artifact: Artifact = await artifacts.readArtifact("MockOnReceive");
          const extension = <MockOnReceive>await waffle.deployContract(this.signers.admin, artifact, []);

          await expect(extendableAsExtend.connect(this.signers.operator).extend(extension.address))
            .to.emit(extendableAsExtend, "Extended")
            .withArgs(extension.address);
        });
      });

      context("as non-operator", async function () {
        it("should fail", async function () {
          const artifact: Artifact = await artifacts.readArtifact("MockOnReceive");
          const extension = <MockOnReceive>await waffle.deployContract(this.signers.admin, artifact, []);

          await expect(extendableAsExtend.connect(this.signers.user0).extend(extension.address)).to.be.revertedWith(
            "HumanboundExtendLogic: unauthorised",
          );
        });
      });

      context("through another extension", async function () {
        it("should succeed", async function () {
          const artifact: Artifact = await artifacts.readArtifact("MockOnReceive");
          const extension = <MockOnReceive>await waffle.deployContract(this.signers.admin, artifact, []);

          const extendableAsInternalExtend = <MockInternalExtend>(
            await getExtendedContractWithInterface(this.extendable.address, "MockInternalExtend")
          );

          await expect(extendableAsInternalExtend.internalExtend(extension.address))
            .to.emit(extendableAsExtend, "Extended")
            .withArgs(extension.address);
        });
      });
    });
  });
}
