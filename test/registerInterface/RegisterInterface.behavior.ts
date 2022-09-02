import { expect } from "chai";
import { artifacts, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import { ExtendLogic, Extendable, RegisterInterfaceLogic } from "../../src/types";
import { getExtendedContractWithInterface } from "../utils";

export function shouldBehaveLikeRegisterInterface(): void {
  let extendableAsRegisterInterface: RegisterInterfaceLogic;

  beforeEach("setup", async function () {
    const extendableArtifact: Artifact = await artifacts.readArtifact("Extendable");
    this.extendable = <Extendable>(
      await waffle.deployContract(this.signers.admin, extendableArtifact, [this.extend.address])
    );

    const registerInterfaceArtifact: Artifact = await artifacts.readArtifact("RegisterInterfaceLogic");
    const registerInterfaceLogic = <RegisterInterfaceLogic>(
      await waffle.deployContract(this.signers.admin, registerInterfaceArtifact, [])
    );

    const extend = <ExtendLogic>await getExtendedContractWithInterface(this.extendable.address, "ExtendLogic");
    await extend.extend(registerInterfaceLogic.address);

    extendableAsRegisterInterface = <RegisterInterfaceLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "RegisterInterfaceLogic")
    );
  });

  describe("Register Interface", async function () {
    const interfaceId = "0x80ac58cd";
    const invalidInterfaceId = "0xffffffff";

    context("with correct owner", async function () {
      it("with valid interfaceId should succeed", async function () {
        await expect(extendableAsRegisterInterface.registerInterface(interfaceId)).to.not.be.reverted;
        expect(await extendableAsRegisterInterface.callStatic.supportsInterface(interfaceId)).to.be.true;
      });

      it("with invalid interfaceId should fail", async function () {
        await expect(extendableAsRegisterInterface.registerInterface(invalidInterfaceId)).to.be.revertedWith(
          "ERC165: invalid interface id",
        );
        expect(await extendableAsRegisterInterface.callStatic.supportsInterface(invalidInterfaceId)).to.be.false;
      });
    });

    context("with incorrect owner", async function () {
      it("should fail", async function () {
        await expect(
          extendableAsRegisterInterface.connect(this.signers.user0).registerInterface(interfaceId),
        ).to.be.revertedWith("RegisterInterfaceLogic: unauthorised");
        expect(await extendableAsRegisterInterface.callStatic.supportsInterface(interfaceId)).to.be.false;
      });
    });
  });
}
