import { parseEther } from "@ethersproject/units";
import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import { Extendable, GasRefundLogic, MockRefund, SoulExtendLogic, SoulPermissionLogic } from "../../src/types";
import { PERMISSIONING } from "../utils/constants";
import { expectEvent, getExtendedContractWithInterface } from "../utils/utils";

const NULL_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export function shouldBehaveLikeGasRefund(): void {
  let extendableAsRefund: GasRefundLogic;
  let extendableAsMockRefund: MockRefund;

  beforeEach("setup", async function () {
    const extendableArtifact: Artifact = await artifacts.readArtifact("Extendable");

    // Owner first deploys, which initialises the deployer as both owner and operator
    this.extendable = <Extendable>(
      await waffle.deployContract(this.signers.owner, extendableArtifact, [this.extend.address])
    );

    const gasRefundArtifact: Artifact = await artifacts.readArtifact("GasRefundLogic");
    const refund = <GasRefundLogic>await waffle.deployContract(this.signers.admin, gasRefundArtifact, []);

    const mockRefundArtifact: Artifact = await artifacts.readArtifact("MockRefund");
    const mockRefund = <MockRefund>await waffle.deployContract(this.signers.admin, mockRefundArtifact, []);

    const permissionArtifact: Artifact = await artifacts.readArtifact("SoulPermissionLogic");
    this.permissioning = <SoulPermissionLogic>await waffle.deployContract(this.signers.admin, permissionArtifact, []);

    const extend = <SoulExtendLogic>await getExtendedContractWithInterface(this.extendable.address, "SoulExtendLogic");
    await extend.connect(this.signers.owner).extend(this.permissioning.address);

    const permission = <SoulPermissionLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "SoulPermissionLogic")
    );
    await permission.connect(this.signers.owner).updateOperator(this.signers.operator.address);

    await extend.connect(this.signers.operator).extend(refund.address);
    await extend.connect(this.signers.operator).extend(mockRefund.address);

    extendableAsRefund = <GasRefundLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "GasRefundLogic")
    );
    extendableAsMockRefund = <MockRefund>await getExtendedContractWithInterface(this.extendable.address, "MockRefund");
  });

  describe("GasRefundLogic", async function () {
    let tx: ContractTransaction | any;

    context("deposit funds", async function () {
      context("as operator", async function () {
        it("should succeed", async function () {
          const deposit = ethers.utils.parseEther("1");
          const contractBalanceBefore = await ethers.provider.getBalance(this.extendable.address);
          await expect(extendableAsRefund.connect(this.signers.operator).depositFunds({ value: deposit }))
            .to.emit(extendableAsRefund, "Deposited")
            .withArgs(this.signers.operator.address, deposit);
          const contractBalanceAfter = await ethers.provider.getBalance(this.extendable.address);
          expect(contractBalanceAfter).to.eq(contractBalanceBefore.add(deposit));
        });
      });

      context("as non-operator", async function () {
        it("should fail", async function () {
          const deposit = ethers.utils.parseEther("1");
          const contractBalanceBefore = await ethers.provider.getBalance(this.extendable.address);
          await expect(
            extendableAsRefund.connect(this.signers.owner).depositFunds({ value: deposit }),
          ).to.be.revertedWith("GasRefund: unauthorised");
          const contractBalanceAfter = await ethers.provider.getBalance(this.extendable.address);
          expect(contractBalanceAfter).to.eq(contractBalanceBefore);
        });
      });
    });

    context("withdraw funds", async function () {
      context("with deposited funds", async function () {
        const deposit = ethers.utils.parseEther("1");

        beforeEach("deposit funds", async function () {
          const contractBalanceBefore = await ethers.provider.getBalance(this.extendable.address);
          await expect(extendableAsRefund.connect(this.signers.operator).depositFunds({ value: deposit }))
            .to.emit(extendableAsRefund, "Deposited")
            .withArgs(this.signers.operator.address, deposit);
          const contractBalanceAfter = await ethers.provider.getBalance(this.extendable.address);
          expect(contractBalanceAfter).to.eq(contractBalanceBefore.add(deposit));
        });

        context("as operator", async function () {
          it("should succeed", async function () {
            const contractBalanceBefore = await ethers.provider.getBalance(this.extendable.address);
            const operatorBalanceBefore = await ethers.provider.getBalance(this.signers.operator.address);

            tx = await expect(extendableAsRefund.connect(this.signers.operator).withdrawFunds(deposit)).to.not.be
              .reverted;
            await expectEvent(tx, extendableAsRefund.interface, "Withdrawn", {
              by: this.signers.operator.address,
              amount: deposit,
            });

            const receipt = await tx.wait();
            const gasSpent = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);

            const contractBalanceAfter = await ethers.provider.getBalance(this.extendable.address);
            const operatorBalanceAfter = await ethers.provider.getBalance(this.signers.operator.address);
            expect(contractBalanceAfter).to.eq(contractBalanceBefore.sub(deposit));
            expect(operatorBalanceAfter).to.eq(operatorBalanceBefore.add(deposit).sub(gasSpent));
          });
        });

        context("as non-operator", async function () {
          it("should fail", async function () {
            const contractBalanceBefore = await ethers.provider.getBalance(this.extendable.address);
            const operatorBalanceBefore = await ethers.provider.getBalance(this.signers.operator.address);

            await expect(extendableAsRefund.connect(this.signers.owner).withdrawFunds(deposit)).to.be.revertedWith(
              "GasRefund: unauthorised",
            );

            const contractBalanceAfter = await ethers.provider.getBalance(this.extendable.address);
            const operatorBalanceAfter = await ethers.provider.getBalance(this.signers.operator.address);
            expect(contractBalanceAfter).to.eq(contractBalanceBefore);
            expect(operatorBalanceAfter).to.eq(operatorBalanceBefore);
          });
        });
      });
    });

    context("refund execution", async function () {
      context("hashing", async function () {
        beforeEach("fund contract", async function () {
          await expect(
            extendableAsRefund.connect(this.signers.operator).depositFunds({ value: parseEther("10") }),
          ).to.not.be.reverted;
        });

        it("should succeed", async function () {
          const contractBalanceBefore = await ethers.provider.getBalance(this.extendable.address);
          const operatorBalanceBefore = await ethers.provider.getBalance(this.signers.operator.address);
          const userBalanceBefore = await ethers.provider.getBalance(this.signers.user0.address);

          tx = await expect(extendableAsMockRefund.connect(this.signers.user0).hashing(1000)).to.not.be.reverted;

          const receipt = await tx.wait();
          const gasSpent = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
          // console.log(receipt);
          console.log("gas cost:", gasSpent);
          // 282472
          // 299223

          // 77347
          // 106656

          const contractBalanceAfter = await ethers.provider.getBalance(this.extendable.address);
          const operatorBalanceAfter = await ethers.provider.getBalance(this.signers.operator.address);
          const userBalanceAfter = await ethers.provider.getBalance(this.signers.user0.address);

          console.log("eth spent:", userBalanceBefore.sub(userBalanceAfter));
          expect(contractBalanceAfter).to.eq(contractBalanceBefore);
          expect(operatorBalanceAfter).to.eq(operatorBalanceBefore);
        });
      });
    });
  });

  // describe("ERC165 compatibility", async function () {
  //   it("should register interface id during constructor correctly", async function () {
  //     expect(await this.permissioning.callStatic.supportsInterface(PERMISSIONING[0].INTERFACE)).to.be.true;
  //     expect(await this.permissioning.callStatic.supportsInterface(PERMISSIONING[1].INTERFACE)).to.be.true;
  //   });

  //   it("should return implemented interfaces correctly", async function () {
  //     expect(await this.permissioning.callStatic.getInterface()).to.deep.equal([
  //       [PERMISSIONING[1].INTERFACE, PERMISSIONING[1].SELECTORS],
  //       [PERMISSIONING[0].INTERFACE, PERMISSIONING[0].SELECTORS],
  //     ]);
  //   });

  //   it("should return solidity interface correctly", async function () {
  //     expect(await this.permissioning.callStatic.getSolidityInterface()).to.equal(
  //       "".concat(
  //         "function init() external;\n",
  //         "function updateOwner(address newOwner) external;\n",
  //         "function renounceOwnership() external;\n",
  //         "function getOwner() external view returns(address);\n",
  //         "function updateOperator(address newOperator) external;\n",
  //         "function getOperator() external returns(address);\n",
  //       ),
  //     );
  //   });
  // });
}
