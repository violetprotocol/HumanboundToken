import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import { Extendable, SoulExtendLogic, SoulPermissionLogic } from "../../src/types";
import { PERMISSIONING } from "../utils/constants";
import { expectEvent, getExtendedContractWithInterface } from "../utils/utils";

const NULL_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export function shouldBehaveLikeSoulPermissioning(): void {
  let extendableAsPermissioning: SoulPermissionLogic;

  beforeEach("setup", async function () {
    const extendableArtifact: Artifact = await artifacts.readArtifact("Extendable");

    // Owner first deploys, which initialises the deployer as both owner and operator
    this.extendable = <Extendable>(
      await waffle.deployContract(this.signers.owner, extendableArtifact, [this.extend.address])
    );

    const permissionArtifact: Artifact = await artifacts.readArtifact("SoulPermissionLogic");
    this.permissioning = <SoulPermissionLogic>await waffle.deployContract(this.signers.admin, permissionArtifact, []);

    const extend = <SoulExtendLogic>await getExtendedContractWithInterface(this.extendable.address, "SoulExtendLogic");
    await extend.connect(this.signers.owner).extend(this.permissioning.address);

    extendableAsPermissioning = <SoulPermissionLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "SoulPermissionLogic")
    );
  });

  describe("SoulPermissionLogic", async function () {
    let tx: ContractTransaction | any;

    context("with initialised owner", async function () {
      context("update owner", async function () {
        it("as owner should succeed", async function () {
          tx = await expect(
            extendableAsPermissioning.connect(this.signers.owner).updateOwner(this.signers.admin.address),
          ).to.not.be.reverted;
          await expectEvent(tx, this.permissioning.interface, "OwnerUpdated", { newOwner: this.signers.admin.address });
          expect(await extendableAsPermissioning.callStatic.getOwner()).to.equal(this.signers.admin.address);
        });

        it("with the zero address should fail", async function () {
          await expect(
            extendableAsPermissioning.connect(this.signers.owner).updateOwner(ethers.constants.AddressZero),
          ).to.be.revertedWith("new owner cannot be the zero address");
          expect(await extendableAsPermissioning.callStatic.getOwner()).to.equal(this.signers.owner.address);
        });

        it("as non-owner should fail", async function () {
          await expect(
            extendableAsPermissioning.connect(this.signers.admin).updateOwner(this.signers.admin.address),
          ).to.be.revertedWith("unauthorised");
          expect(await extendableAsPermissioning.callStatic.getOwner()).to.equal(this.signers.owner.address);
        });
      });

      context("renounce ownership", async function () {
        it("as non-owner should fail", async function () {
          await expect(extendableAsPermissioning.connect(this.signers.admin).renounceOwnership()).to.be.revertedWith(
            "unauthorised",
          );
          expect(await extendableAsPermissioning.callStatic.getOwner()).to.equal(this.signers.owner.address);
        });

        it("should set owner to the null address", async function () {
          tx = await expect(extendableAsPermissioning.connect(this.signers.owner).renounceOwnership()).to.not.be
            .reverted;
          await expectEvent(tx, this.permissioning.interface, "OwnerUpdated", { newOwner: NULL_ADDRESS });
          expect(await extendableAsPermissioning.callStatic.getOwner()).to.equal(NULL_ADDRESS);
        });
      });

      context("update operator", async function () {
        it("as owner should succeed", async function () {
          tx = await expect(
            extendableAsPermissioning.connect(this.signers.owner).updateOperator(this.signers.operator.address),
          ).to.not.be.reverted;
          await expectEvent(tx, this.permissioning.interface, "OperatorUpdated", {
            newOperator: this.signers.operator.address,
          });
          expect(await extendableAsPermissioning.callStatic.getOperator()).to.equal(this.signers.operator.address);
        });

        it("as non-owner should fail", async function () {
          await expect(
            extendableAsPermissioning.connect(this.signers.user0).updateOperator(this.signers.user0.address),
          ).to.be.revertedWith("unauthorised");
          expect(await extendableAsPermissioning.callStatic.getOperator()).to.equal(this.signers.owner.address);
        });
      });
    });
  });

  describe("ERC165 compatibility", async function () {
    it("should register interface id during constructor correctly", async function () {
      expect(await this.permissioning.callStatic.supportsInterface(PERMISSIONING[0].INTERFACE)).to.be.true;
      expect(await this.permissioning.callStatic.supportsInterface(PERMISSIONING[1].INTERFACE)).to.be.true;
    });

    it("should return implemented interfaces correctly", async function () {
      expect(await this.permissioning.callStatic.getInterface()).to.deep.equal([
        [PERMISSIONING[1].INTERFACE, PERMISSIONING[1].SELECTORS],
        [PERMISSIONING[0].INTERFACE, PERMISSIONING[0].SELECTORS],
      ]);
    });

    it("should return solidity interface correctly", async function () {
      expect(await this.permissioning.callStatic.getSolidityInterface()).to.equal(
        "".concat(
          "function init() external;\n",
          "function updateOwner(address newOwner) external;\n",
          "function renounceOwnership() external;\n",
          "function getOwner() external view returns(address);\n",
          "function updateOperator(address newOperator) external;\n",
          "function getOperator() external returns(address);\n",
        ),
      );
    });
  });
}
