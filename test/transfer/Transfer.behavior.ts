import { isBytesLike, splitSignature } from "@ethersproject/bytes";
import { utils } from "@violetprotocol/ethereum-access-token-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import {
  ApproveLogic,
  BasicSetTokenURILogic,
  EATVerifier,
  ERC721HooksLogic,
  ExtendLogic,
  Extendable,
  GetterLogic,
  MetadataGetterLogic,
  OnReceiveLogic,
  SetTokenURILogic,
  SoulMintLogic,
  SoulTransferLogic,
  TokenURILogic,
} from "../../src/types";
import { getExtendedContractWithInterface } from "../utils";

export function shouldBehaveLikeTransfer(): void {
  let extendableAsMint: SoulMintLogic;
  let extendableAsGetter: GetterLogic;
  let extendableAsTokenURI: TokenURILogic;
  let extendableAsTransfer: SoulTransferLogic;

  beforeEach("setup", async function () {
    const extendableArtifact: Artifact = await artifacts.readArtifact("Extendable");
    this.extendable = <Extendable>(
      await waffle.deployContract(this.signers.admin, extendableArtifact, [this.extend.address])
    );

    const erc721GetterArtifact: Artifact = await artifacts.readArtifact("GetterLogic");
    const erc721GetterLogic = <GetterLogic>await waffle.deployContract(this.signers.admin, erc721GetterArtifact, []);

    const erc721HooksArtifact: Artifact = await artifacts.readArtifact("ERC721HooksLogic");
    const erc721HooksLogic = <ERC721HooksLogic>await waffle.deployContract(this.signers.admin, erc721HooksArtifact, []);

    const setTokenURIArtifact: Artifact = await artifacts.readArtifact("SetTokenURILogic");
    const setTokenURILogic = <SetTokenURILogic>await waffle.deployContract(this.signers.admin, setTokenURIArtifact, []);

    const tokenURILogicArtifact: Artifact = await artifacts.readArtifact("TokenURILogic");
    const tokenURILogic = <TokenURILogic>await waffle.deployContract(this.signers.admin, tokenURILogicArtifact, []);

    const transferLogicArtifact: Artifact = await artifacts.readArtifact("SoulTransferLogic");
    const transferLogic = <SoulTransferLogic>await waffle.deployContract(this.signers.admin, transferLogicArtifact, []);

    const onReceiveArtifact: Artifact = await artifacts.readArtifact("OnReceiveLogic");
    const onReceiveLogic = <OnReceiveLogic>await waffle.deployContract(this.signers.admin, onReceiveArtifact, []);

    const approveArtifact: Artifact = await artifacts.readArtifact("ApproveLogic");
    const approveLogic = <ApproveLogic>await waffle.deployContract(this.signers.admin, approveArtifact, []);

    const extend = <ExtendLogic>await getExtendedContractWithInterface(this.extendable.address, "ExtendLogic");
    await extend.extend(this.verifierExtension.address);
    await extend.extend(this.mintLogic.address);
    await extend.extend(erc721GetterLogic.address);
    await extend.extend(erc721HooksLogic.address);
    await extend.extend(setTokenURILogic.address);
    await extend.extend(tokenURILogic.address);
    await extend.extend(transferLogic.address);
    await extend.extend(onReceiveLogic.address);
    await extend.extend(approveLogic.address);

    const extendableAsVerifierExtension = <EATVerifier>(
      await getExtendedContractWithInterface(this.extendable.address, "EATVerifier")
    );
    await extendableAsVerifierExtension.setVerifier(this.verifier.address);

    extendableAsMint = <SoulMintLogic>await getExtendedContractWithInterface(this.extendable.address, "SoulMintLogic");
    extendableAsTransfer = <SoulTransferLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "SoulTransferLogic")
    );
    extendableAsGetter = <GetterLogic>await getExtendedContractWithInterface(this.extendable.address, "GetterLogic");
    extendableAsTokenURI = <TokenURILogic>(
      await getExtendedContractWithInterface(this.extendable.address, "TokenURILogic")
    );
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

        context("from correct user", async function () {
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
            ).to.not.be.reverted;

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

        context("from correct user", async function () {
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
            ).to.not.be.reverted;

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

        context("from correct user", async function () {
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
            ).to.not.be.reverted;

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
      });
    });
  });
}
