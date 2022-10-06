import { splitSignature } from "@ethersproject/bytes";
import { utils } from "@violetprotocol/ethereum-access-token-helpers";
import { expect } from "chai";
import { BigNumber, Contract, ContractTransaction } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import {
  Extendable,
  HumanboundExtendLogic,
  HumanboundPermissionLogic,
  HumanboundRetractLogic,
  MockInternalExtend,
  MockOnReceive,
} from "../../src/types";
import { getExtendedContractWithInterface } from "../utils/utils";

export function shouldBehaveLikeHumanboundRetract(): void {
  let extendableAsExtend: HumanboundExtendLogic;
  let extendableAsRetract: HumanboundRetractLogic;

  beforeEach("setup", async function () {
    const extendableArtifact: Artifact = await artifacts.readArtifact("Extendable");
    this.extendable = <Extendable>(
      await waffle.deployContract(this.signers.owner, extendableArtifact, [this.extend.address])
    );

    const retractArtifact: Artifact = await artifacts.readArtifact("HumanboundRetractLogic");
    this.retract = <HumanboundRetractLogic>await waffle.deployContract(this.signers.admin, retractArtifact, []);

    extendableAsExtend = <HumanboundExtendLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "ExtendLogic")
    );
    await extendableAsExtend.connect(this.signers.owner).extend(this.permissioning.address);

    const permission = <HumanboundPermissionLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundPermissionLogic")
    );
    await permission.connect(this.signers.owner).updateOperator(this.signers.operator.address);

    await extendableAsExtend.connect(this.signers.operator).extend(this.retract.address);

    extendableAsRetract = <HumanboundRetractLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundRetractLogic")
    );
  });

  describe("Retract", async () => {
    context("retract", async function () {
      context("with extension", async function () {
        let extension: Contract;

        beforeEach("extend with Mock", async function () {
          const artifact: Artifact = await artifacts.readArtifact("MockOnReceive");
          extension = <MockOnReceive>await waffle.deployContract(this.signers.admin, artifact, []);

          await expect(extendableAsExtend.connect(this.signers.operator).extend(extension.address))
            .to.emit(extendableAsExtend, "Extended")
            .withArgs(extension.address);

          expect(await extendableAsExtend.callStatic.getExtensionAddresses()).to.deep.equal([
            this.extend.address,
            this.permissioning.address,
            this.retract.address,
            extension.address,
          ]);
        });

        it("as operator should succeed", async function () {
          await expect(extendableAsRetract.connect(this.signers.operator).retract(extension.address))
            .to.emit(extendableAsRetract, "Retracted")
            .withArgs(extension.address);

          expect(await extendableAsExtend.callStatic.getExtensionAddresses()).to.deep.equal([
            this.extend.address,
            this.permissioning.address,
            this.retract.address,
          ]);
        });

        it("as non-operator should fail", async function () {
          await expect(extendableAsRetract.connect(this.signers.user0).retract(extension.address)).to.be.revertedWith(
            "HumanboundRetractLogic: unauthorised",
          );

          expect(await extendableAsExtend.callStatic.getExtensionAddresses()).to.deep.equal([
            this.extend.address,
            this.permissioning.address,
            this.retract.address,
            extension.address,
          ]);
        });
      });
    });
  });
}
