import { splitSignature } from "@ethersproject/bytes";
import { utils } from "@violetprotocol/ethereum-access-token-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
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
  HumanboundMintLogic,
  HumanboundPermissionLogic,
  HumanboundTransferLogic,
  OnReceiveLogic,
} from "../../src/types";
import { HumanboundTokenURILogic } from "../../src/types/contracts/extensions/tokenURI/HumanboundTokenURILogic";
import { getExtendedContractWithInterface } from "../utils/utils";

export function shouldBehaveLikeTransfer(): void {
  let extendableAsMint: HumanboundMintLogic;
  let extendableAsGetter: GetterLogic;
  let extendableAsTokenURI: HumanboundTokenURILogic;
  let extendableAsTransfer: HumanboundTransferLogic;

  beforeEach("setup", async function () {
    const extendableArtifact: Artifact = await artifacts.readArtifact("Extendable");
    this.extendable = <Extendable>(
      await waffle.deployContract(this.signers.owner, extendableArtifact, [this.extend.address])
    );

    const erc721GetterArtifact: Artifact = await artifacts.readArtifact("GetterLogic");
    const erc721GetterLogic = <GetterLogic>await waffle.deployContract(this.signers.admin, erc721GetterArtifact, []);

    const erc721HooksArtifact: Artifact = await artifacts.readArtifact("ERC721HooksLogic");
    const erc721HooksLogic = <ERC721HooksLogic>await waffle.deployContract(this.signers.admin, erc721HooksArtifact, []);

    const humanboundTokenURILogicArtifact: Artifact = await artifacts.readArtifact("HumanboundTokenURILogic");
    const humanboundTokenURILogic = <HumanboundTokenURILogic>(
      await waffle.deployContract(this.signers.admin, humanboundTokenURILogicArtifact, [])
    );

    const transferLogicArtifact: Artifact = await artifacts.readArtifact("HumanboundTransferLogic");
    const transferLogic = <HumanboundTransferLogic>(
      await waffle.deployContract(this.signers.admin, transferLogicArtifact, [])
    );

    const onReceiveArtifact: Artifact = await artifacts.readArtifact("OnReceiveLogic");
    const onReceiveLogic = <OnReceiveLogic>await waffle.deployContract(this.signers.admin, onReceiveArtifact, []);

    const approveArtifact: Artifact = await artifacts.readArtifact("ApproveLogic");
    const approveLogic = <ApproveLogic>await waffle.deployContract(this.signers.admin, approveArtifact, []);

    const extend = <ExtendLogic>await getExtendedContractWithInterface(this.extendable.address, "ExtendLogic");
    await extend.connect(this.signers.owner).extend(this.permissioning.address);

    const gasRefundArtifact: Artifact = await artifacts.readArtifact("GasRefundLogic");
    const refund = <GasRefundLogic>await waffle.deployContract(this.signers.admin, gasRefundArtifact, []);

    const permission = <HumanboundPermissionLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundPermissionLogic")
    );
    await permission.connect(this.signers.owner).updateOperator(this.signers.operator.address);

    await extend.connect(this.signers.operator).extend(this.verifierExtension.address);
    await extend.connect(this.signers.operator).extend(this.mintLogic.address);
    await extend.connect(this.signers.operator).extend(erc721GetterLogic.address);
    await extend.connect(this.signers.operator).extend(erc721HooksLogic.address);
    await extend.connect(this.signers.operator).extend(humanboundTokenURILogic.address);
    await extend.connect(this.signers.operator).extend(transferLogic.address);
    await extend.connect(this.signers.operator).extend(onReceiveLogic.address);
    await extend.connect(this.signers.operator).extend(approveLogic.address);
    await extend.connect(this.signers.operator).extend(refund.address);

    const extendableAsVerifierExtension = <EATVerifierConnector>(
      await getExtendedContractWithInterface(this.extendable.address, "EATVerifierConnector")
    );
    await extendableAsVerifierExtension.connect(this.signers.operator).setVerifier(this.verifier.address);

    extendableAsMint = <HumanboundMintLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundMintLogic")
    );
    extendableAsTransfer = <HumanboundTransferLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundTransferLogic")
    );
    extendableAsGetter = <GetterLogic>await getExtendedContractWithInterface(this.extendable.address, "GetterLogic");
    extendableAsTokenURI = <HumanboundTokenURILogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundTokenURILogic")
    );
    const extendableAsRefund = <GasRefundLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "GasRefundLogic")
    );
    await expect(
      extendableAsRefund.connect(this.signers.operator).depositFunds({ value: parseEther("10") }),
    ).to.not.be.reverted;
  });

  describe("Transfer", async () => {
    const tokenId = 42;

    context("with minted token", async () => {
      beforeEach("mint token", async function () {
        this.params = [this.signers.user0.address, tokenId];
        this.value = {
          expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 50000),
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
        )
          .to.emit(extendableAsMint, "Transfer")
          .withArgs(ethers.constants.AddressZero, this.signers.user0.address, tokenId);
      });

      describe("transferFrom", async function () {
        beforeEach("construct ethereum access token", async function () {
          this.value = {
            expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 50000),
            functionCall: {
              functionSignature: extendableAsTransfer.interface.getSighash(
                "transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
              ),
              target: extendableAsTransfer.address.toLowerCase(),
              caller: this.signers.user0.address.toLowerCase(),
              parameters: utils.packParameters(
                extendableAsTransfer.interface,
                "transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                [this.signers.user0.address.toLowerCase(), this.signers.user1.address.toLowerCase(), tokenId],
              ),
            },
          };

          this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
        });

        context("as token owner", async function () {
          it("transfer should transfer successfully", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            )
              .to.emit(extendableAsTransfer, "Transfer")
              .withArgs(this.signers.user0.address, this.signers.user1.address, tokenId);

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user1.address);
          });
        });

        context("as token recipient", async function () {
          beforeEach("construct ethereum access token", async function () {
            this.value = {
              expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 50000),
              functionCall: {
                functionSignature: extendableAsTransfer.interface.getSighash(
                  "transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                ),
                target: extendableAsTransfer.address.toLowerCase(),
                caller: this.signers.user1.address.toLowerCase(),
                parameters: utils.packParameters(
                  extendableAsTransfer.interface,
                  "transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                  [this.signers.user0.address.toLowerCase(), this.signers.user1.address.toLowerCase(), tokenId],
                ),
              },
            };

            this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
          });

          it("transfer should transfer successfully", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user1)
                ["transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            )
              .to.emit(extendableAsTransfer, "Transfer")
              .withArgs(this.signers.user0.address, this.signers.user1.address, tokenId);

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user1.address);
          });
        });

        context("as third party", async function () {
          beforeEach("construct ethereum access token", async function () {
            this.value = {
              expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 50000),
              functionCall: {
                functionSignature: extendableAsTransfer.interface.getSighash(
                  "transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                ),
                target: extendableAsTransfer.address.toLowerCase(),
                caller: this.signers.user2.address.toLowerCase(),
                parameters: utils.packParameters(
                  extendableAsTransfer.interface,
                  "transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                  [this.signers.user0.address.toLowerCase(), this.signers.user1.address.toLowerCase(), tokenId],
                ),
              },
            };

            this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
          });

          it("transfer should transfer successfully", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user2)
                ["transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            )
              .to.emit(extendableAsTransfer, "Transfer")
              .withArgs(this.signers.user0.address, this.signers.user1.address, tokenId);

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user1.address);
          });
        });

        context("from incorrect EAT signer", async function () {
          beforeEach("construct ethereum access token", async function () {
            this.signature = splitSignature(await utils.signAccessToken(this.signers.user1, this.domain, this.value));
          });

          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            ).to.be.revertedWith("AccessToken: verification failure");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });

        context("from incorrect user", async function () {
          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user1)
                ["transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            ).to.be.revertedWith("AccessToken: verification failure");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });

        context("to incorrect recipient", async function () {
          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.admin.address,
                  tokenId,
                ),
            ).to.be.revertedWith("AccessToken: verification failure");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });

        context("with expired EAT", async function () {
          beforeEach("construct ethereum access token", async function () {
            this.value = {
              expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) - 10),
              functionCall: {
                functionSignature: extendableAsTransfer.interface.getSighash(
                  "transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                ),
                target: extendableAsTransfer.address.toLowerCase(),
                caller: this.signers.user0.address.toLowerCase(),
                parameters: utils.packParameters(
                  extendableAsTransfer.interface,
                  "transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                  [this.signers.user0.address.toLowerCase(), this.signers.user1.address.toLowerCase(), tokenId],
                ),
              },
            };
            this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
          });

          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["transferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            ).to.be.revertedWith("AccessToken: has expired");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });

        context("without EAT", async function () {
          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["transferFrom(address,address,uint256)"](
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            ).to.be.revertedWith("HumanboundTransferLogic-transferFrom: disallowed without EAT");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });
      });

      describe("safeTransferFrom without data", async function () {
        beforeEach("construct ethereum access token", async function () {
          this.value = {
            expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 50000),
            functionCall: {
              functionSignature: extendableAsTransfer.interface.getSighash(
                "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
              ),
              target: extendableAsTransfer.address.toLowerCase(),
              caller: this.signers.user0.address.toLowerCase(),
              parameters: utils.packParameters(
                extendableAsTransfer.interface,
                "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                [this.signers.user0.address.toLowerCase(), this.signers.user1.address.toLowerCase(), tokenId],
              ),
            },
          };

          this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
        });

        context("as token owner", async function () {
          it("transfer should transfer successfully", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            )
              .to.emit(extendableAsTransfer, "Transfer")
              .withArgs(this.signers.user0.address, this.signers.user1.address, tokenId);

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user1.address);
          });
        });

        context("as token recipient", async function () {
          beforeEach("construct ethereum access token", async function () {
            this.value = {
              expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 50000),
              functionCall: {
                functionSignature: extendableAsTransfer.interface.getSighash(
                  "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                ),
                target: extendableAsTransfer.address.toLowerCase(),
                caller: this.signers.user1.address.toLowerCase(),
                parameters: utils.packParameters(
                  extendableAsTransfer.interface,
                  "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                  [this.signers.user0.address.toLowerCase(), this.signers.user1.address.toLowerCase(), tokenId],
                ),
              },
            };

            this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
          });

          it("transfer should transfer successfully", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user1)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            )
              .to.emit(extendableAsTransfer, "Transfer")
              .withArgs(this.signers.user0.address, this.signers.user1.address, tokenId);

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user1.address);
          });
        });

        context("as third party", async function () {
          beforeEach("construct ethereum access token", async function () {
            this.value = {
              expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 50000),
              functionCall: {
                functionSignature: extendableAsTransfer.interface.getSighash(
                  "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                ),
                target: extendableAsTransfer.address.toLowerCase(),
                caller: this.signers.user2.address.toLowerCase(),
                parameters: utils.packParameters(
                  extendableAsTransfer.interface,
                  "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                  [this.signers.user0.address.toLowerCase(), this.signers.user1.address.toLowerCase(), tokenId],
                ),
              },
            };

            this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
          });

          it("transfer should transfer successfully", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user2)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            )
              .to.emit(extendableAsTransfer, "Transfer")
              .withArgs(this.signers.user0.address, this.signers.user1.address, tokenId);

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user1.address);
          });
        });

        context("from incorrect EAT signer", async function () {
          beforeEach("construct ethereum access token", async function () {
            this.signature = splitSignature(await utils.signAccessToken(this.signers.user1, this.domain, this.value));
          });

          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            ).to.be.revertedWith("AccessToken: verification failure");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });

        context("from incorrect user", async function () {
          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user1)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            ).to.be.revertedWith("AccessToken: verification failure");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });

        context("to incorrect recipient", async function () {
          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.admin.address,
                  tokenId,
                ),
            ).to.be.revertedWith("AccessToken: verification failure");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });

        context("with expired EAT", async function () {
          beforeEach("construct ethereum access token", async function () {
            this.value = {
              expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) - 10),
              functionCall: {
                functionSignature: extendableAsTransfer.interface.getSighash(
                  "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                ),
                target: extendableAsTransfer.address.toLowerCase(),
                caller: this.signers.user0.address.toLowerCase(),
                parameters: utils.packParameters(
                  extendableAsTransfer.interface,
                  "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)",
                  [this.signers.user0.address.toLowerCase(), this.signers.user1.address.toLowerCase(), tokenId],
                ),
              },
            };
            this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
          });

          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            ).to.be.revertedWith("AccessToken: has expired");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });

        context("without EAT", async function () {
          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["safeTransferFrom(address,address,uint256)"](
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                ),
            ).to.be.revertedWith("HumanboundTransferLogic-safeTransferFrom: disallowed without EAT");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });
      });

      describe("safeTransferFrom with data", async function () {
        beforeEach("construct ethereum access token", async function () {
          this.value = {
            expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 50000),
            functionCall: {
              functionSignature: extendableAsTransfer.interface.getSighash(
                "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)",
              ),
              target: extendableAsTransfer.address.toLowerCase(),
              caller: this.signers.user0.address.toLowerCase(),
              parameters: utils.packParameters(
                extendableAsTransfer.interface,
                "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)",
                [this.signers.user0.address.toLowerCase(), this.signers.user1.address.toLowerCase(), tokenId, "0xab"],
              ),
            },
          };

          this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
        });

        context("as token owner", async function () {
          it("transfer should transfer successfully", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                  "0xab",
                ),
            )
              .to.emit(extendableAsTransfer, "Transfer")
              .withArgs(this.signers.user0.address, this.signers.user1.address, tokenId);

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user1.address);
          });
        });

        context("as token recipient", async function () {
          beforeEach("construct ethereum access token", async function () {
            this.value = {
              expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 50000),
              functionCall: {
                functionSignature: extendableAsTransfer.interface.getSighash(
                  "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)",
                ),
                target: extendableAsTransfer.address.toLowerCase(),
                caller: this.signers.user1.address.toLowerCase(),
                parameters: utils.packParameters(
                  extendableAsTransfer.interface,
                  "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)",
                  [this.signers.user0.address.toLowerCase(), this.signers.user1.address.toLowerCase(), tokenId, "0xab"],
                ),
              },
            };

            this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
          });

          it("transfer should transfer successfully", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user1)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                  "0xab",
                ),
            )
              .to.emit(extendableAsTransfer, "Transfer")
              .withArgs(this.signers.user0.address, this.signers.user1.address, tokenId);

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user1.address);
          });
        });

        context("as third party", async function () {
          beforeEach("construct ethereum access token", async function () {
            this.value = {
              expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 50000),
              functionCall: {
                functionSignature: extendableAsTransfer.interface.getSighash(
                  "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)",
                ),
                target: extendableAsTransfer.address.toLowerCase(),
                caller: this.signers.user2.address.toLowerCase(),
                parameters: utils.packParameters(
                  extendableAsTransfer.interface,
                  "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)",
                  [this.signers.user0.address.toLowerCase(), this.signers.user1.address.toLowerCase(), tokenId, "0xab"],
                ),
              },
            };

            this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
          });

          it("transfer should transfer successfully", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user2)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                  "0xab",
                ),
            )
              .to.emit(extendableAsTransfer, "Transfer")
              .withArgs(this.signers.user0.address, this.signers.user1.address, tokenId);

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user1.address);
          });
        });

        context("from incorrect EAT signer", async function () {
          beforeEach("construct ethereum access token", async function () {
            this.signature = splitSignature(await utils.signAccessToken(this.signers.user1, this.domain, this.value));
          });

          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                  "0xab",
                ),
            ).to.be.revertedWith("AccessToken: verification failure");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });

        context("from incorrect user", async function () {
          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user1)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                  "0xab",
                ),
            ).to.be.revertedWith("AccessToken: verification failure");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });

        context("to incorrect recipient", async function () {
          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.admin.address,
                  tokenId,
                  "0xab",
                ),
            ).to.be.revertedWith("AccessToken: verification failure");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });

        context("with expired EAT", async function () {
          beforeEach("construct ethereum access token", async function () {
            this.value = {
              expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) - 10),
              functionCall: {
                functionSignature: extendableAsTransfer.interface.getSighash(
                  "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)",
                ),
                target: extendableAsTransfer.address.toLowerCase(),
                caller: this.signers.user0.address.toLowerCase(),
                parameters: utils.packParameters(
                  extendableAsTransfer.interface,
                  "safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)",
                  [this.signers.user0.address.toLowerCase(), this.signers.user1.address.toLowerCase(), tokenId, "0xab"],
                ),
              },
            };
            this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
          });

          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["safeTransferFrom(uint8,bytes32,bytes32,uint256,address,address,uint256,bytes)"](
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                  "0xab",
                ),
            ).to.be.revertedWith("AccessToken: has expired");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });

        context("without EAT", async function () {
          it("should fail to transfer", async function () {
            await expect(
              extendableAsTransfer
                .connect(this.signers.user0)
                ["safeTransferFrom(address,address,uint256,bytes)"](
                  this.signers.user0.address,
                  this.signers.user1.address,
                  tokenId,
                  "0xab",
                ),
            ).to.be.revertedWith("HumanboundTransferLogic-safeTransferFrom: disallowed without EAT");

            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });
      });
    });
  });
}
