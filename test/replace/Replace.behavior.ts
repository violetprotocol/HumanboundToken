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
  HumanboundReplaceLogic,
  HumanboundRetractLogic,
  MockOnReceive,
} from "../../src/types";
import { getExtendedContractWithInterface } from "../utils/utils";

export function shouldBehaveLikeHumanboundReplace(): void {
  let extendableAsExtend: HumanboundExtendLogic;
  let extendableAsReplace: HumanboundReplaceLogic;

  beforeEach("setup", async function () {
    const extendableArtifact: Artifact = await artifacts.readArtifact("Extendable");
    this.extendable = <Extendable>(
      await waffle.deployContract(this.signers.owner, extendableArtifact, [this.extend.address])
    );

    const retractArtifact: Artifact = await artifacts.readArtifact("HumanboundRetractLogic");
    this.retract = <HumanboundRetractLogic>await waffle.deployContract(this.signers.admin, retractArtifact, []);

    const replaceArtifact: Artifact = await artifacts.readArtifact("HumanboundReplaceLogic");
    this.replace = <HumanboundReplaceLogic>await waffle.deployContract(this.signers.admin, replaceArtifact, []);

    extendableAsExtend = <HumanboundExtendLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "ExtendLogic")
    );
    await extendableAsExtend.connect(this.signers.owner).extend(this.permissioning.address);

    const permission = <HumanboundPermissionLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundPermissionLogic")
    );
    await permission.connect(this.signers.owner).updateOperator(this.signers.operator.address);

    await extendableAsExtend.connect(this.signers.operator).extend(this.retract.address);
    await extendableAsExtend.connect(this.signers.operator).extend(this.replace.address);

    extendableAsReplace = <HumanboundReplaceLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundReplaceLogic")
    );
  });

  describe("Replace", async () => {
    context("replace", async function () {
      context("with extensions", async function () {
        let oldExtension: Contract;
        let newExtension: Contract;

        beforeEach("extend with Mock", async function () {
          const artifact: Artifact = await artifacts.readArtifact("MockOnReceive");
          oldExtension = <MockOnReceive>await waffle.deployContract(this.signers.admin, artifact, []);
          newExtension = <MockOnReceive>await waffle.deployContract(this.signers.admin, artifact, []);

          await expect(extendableAsExtend.connect(this.signers.operator).extend(oldExtension.address))
            .to.emit(extendableAsExtend, "Extended")
            .withArgs(oldExtension.address);

          expect(await extendableAsExtend.callStatic.getExtensionAddresses()).to.deep.equal([
            this.extend.address,
            this.permissioning.address,
            this.retract.address,
            this.replace.address,
            oldExtension.address,
          ]);
        });

        it("as operator should succeed", async function () {
          await expect(
            extendableAsReplace.connect(this.signers.operator).replace(oldExtension.address, newExtension.address),
          )
            .to.emit(extendableAsReplace, "Replaced")
            .withArgs(oldExtension.address, newExtension.address);

          expect(await extendableAsExtend.callStatic.getExtensionAddresses()).to.deep.equal([
            this.extend.address,
            this.permissioning.address,
            this.retract.address,
            this.replace.address,
            newExtension.address,
          ]);
        });

        it("as non-operator should fail", async function () {
          await expect(
            extendableAsReplace.connect(this.signers.user0).replace(oldExtension.address, newExtension.address),
          ).to.be.revertedWith("HumanboundReplaceLogic: unauthorised");

          expect(await extendableAsExtend.callStatic.getExtensionAddresses()).to.deep.equal([
            this.extend.address,
            this.permissioning.address,
            this.retract.address,
            this.replace.address,
            oldExtension.address,
          ]);
        });
      });
    });
  });
}
