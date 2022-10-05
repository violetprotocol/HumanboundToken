import { splitSignature } from "@ethersproject/bytes";
import { utils } from "@violetprotocol/ethereum-access-token-helpers";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import {
  ApproveLogic,
  EATVerifierConnector,
  ERC721HooksLogic,
  ExtendLogic,
  Extendable,
  GasRefundLogic,
  GetterLogic,
  HumanboundBurnLogic,
  HumanboundMintLogic,
  HumanboundPermissionLogic,
  SetTokenURILogic,
} from "../../src/types";
import { HumanboundApproveLogic } from "../../src/types/contracts/extensions/approve";
import { getExtendedContractWithInterface } from "../utils/utils";

export function shouldBehaveLikeHumanboundApprove(): void {
  let extendableAsMint: HumanboundMintLogic;
  let extendableAsApprove: HumanboundApproveLogic;
  let extendableAsGetter: GetterLogic;

  beforeEach("setup", async function () {
    const extendableArtifact: Artifact = await artifacts.readArtifact("Extendable");
    this.extendable = <Extendable>(
      await waffle.deployContract(this.signers.owner, extendableArtifact, [this.extend.address])
    );

    const erc721GetterArtifact: Artifact = await artifacts.readArtifact("GetterLogic");
    const erc721GetterLogic = <GetterLogic>await waffle.deployContract(this.signers.admin, erc721GetterArtifact, []);

    const erc721HooksArtifact: Artifact = await artifacts.readArtifact("ERC721HooksLogic");
    const erc721HooksLogic = <ERC721HooksLogic>await waffle.deployContract(this.signers.admin, erc721HooksArtifact, []);

    const setTokenURIArtifact: Artifact = await artifacts.readArtifact("SetTokenURILogic");
    const setTokenURILogic = <SetTokenURILogic>await waffle.deployContract(this.signers.admin, setTokenURIArtifact, []);

    const approveArtifact: Artifact = await artifacts.readArtifact("HumanboundApproveLogic");
    const approveLogic = <HumanboundApproveLogic>await waffle.deployContract(this.signers.admin, approveArtifact);

    const gasRefundArtifact: Artifact = await artifacts.readArtifact("GasRefundLogic");
    const refund = <GasRefundLogic>await waffle.deployContract(this.signers.admin, gasRefundArtifact, []);

    const burnArtifact: Artifact = await artifacts.readArtifact("HumanboundBurnLogic");
    this.burnLogic = <HumanboundBurnLogic>await waffle.deployContract(this.signers.admin, burnArtifact);

    const extend = <ExtendLogic>await getExtendedContractWithInterface(this.extendable.address, "ExtendLogic");
    await extend.connect(this.signers.owner).extend(this.permissioning.address);

    const permission = <HumanboundPermissionLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundPermissionLogic")
    );
    await permission.connect(this.signers.owner).updateOperator(this.signers.operator.address);

    await extend.connect(this.signers.operator).extend(this.verifierExtension.address);
    await extend.connect(this.signers.operator).extend(this.mintLogic.address);
    await extend.connect(this.signers.operator).extend(erc721GetterLogic.address);
    await extend.connect(this.signers.operator).extend(erc721HooksLogic.address);
    await extend.connect(this.signers.operator).extend(setTokenURILogic.address);
    await extend.connect(this.signers.operator).extend(approveLogic.address);
    await extend.connect(this.signers.operator).extend(this.burnLogic.address);
    await extend.connect(this.signers.operator).extend(refund.address);

    const extendableAsVerifierExtension = <EATVerifierConnector>(
      await getExtendedContractWithInterface(this.extendable.address, "EATVerifierConnector")
    );
    await extendableAsVerifierExtension.connect(this.signers.operator).setVerifier(this.verifier.address);

    extendableAsMint = <HumanboundMintLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundMintLogic")
    );
    extendableAsApprove = <HumanboundApproveLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundApproveLogic")
    );
    extendableAsGetter = <GetterLogic>await getExtendedContractWithInterface(this.extendable.address, "GetterLogic");
    const extendableAsRefund = <GasRefundLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "GasRefundLogic")
    );
    await expect(
      extendableAsRefund.connect(this.signers.operator).depositFunds({ value: parseEther("10") }),
    ).to.not.be.reverted;
  });

  describe("Approve", async () => {
    const tokenId = 42;
    const burnProofURI = "violet.co/burn";

    context("with minted tokens", async function () {
      beforeEach("mint token", async function () {
        this.value = {
          expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 300),
          functionCall: {
            functionSignature: extendableAsMint.interface.getSighash("mint"),
            target: extendableAsMint.address.toLowerCase(),
            caller: this.signers.user0.address.toLowerCase(),
            parameters: utils.packParameters(extendableAsMint.interface, "mint", [
              this.signers.user0.address.toLowerCase(),
              tokenId,
              "",
            ]),
          },
        };
        this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));

        await expect(
          extendableAsMint
            .connect(this.signers.user0)
            .mint(
              this.signature.v,
              this.signature.r,
              this.signature.s,
              this.value.expiry,
              this.signers.user0.address,
              tokenId,
              "",
            ),
        ).to.not.be.reverted;
      });

      context("approve", async function () {
        it("should fail", async function () {
          await expect(
            extendableAsApprove.connect(this.signers.user0).approve(this.signers.user1.address, tokenId),
          ).to.be.revertedWith("HumanboundApproveLogic: approvals disallowed");
        });
      });

      context("setApprovalForAll", async function () {
        it("should fail", async function () {
          await expect(
            extendableAsApprove.connect(this.signers.user0).setApprovalForAll(this.signers.user1.address, true),
          ).to.be.revertedWith("HumanboundApproveLogic: approvals disallowed");

          await expect(
            extendableAsApprove.connect(this.signers.user0).setApprovalForAll(this.signers.user1.address, false),
          ).to.be.revertedWith("HumanboundApproveLogic: approvals disallowed");
        });
      });
    });
  });
}
