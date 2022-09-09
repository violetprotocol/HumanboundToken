import { splitSignature } from "@ethersproject/bytes";
import { utils } from "@violetprotocol/ethereum-access-token-helpers";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import {
  EATVerifierConnector,
  ERC721HooksLogic,
  Extendable,
  GasRefundLogic,
  GetterLogic,
  HumanboundExtendLogic,
  HumanboundMintLogic,
  HumanboundPermissionLogic,
} from "../../src/types";
import { HumanboundTokenURILogic } from "../../src/types/contracts/extensions/tokenURI/HumanboundTokenURILogic";
import { getExtendedContractWithInterface } from "../utils/utils";

export function shouldBehaveLikeTokenURI(): void {
  let extendableAsMint: HumanboundMintLogic;
  let extendableAsTokenURI: HumanboundTokenURILogic;

  beforeEach("setup", async function () {
    const extendableArtifact: Artifact = await artifacts.readArtifact("Extendable");
    this.extendable = <Extendable>(
      await waffle.deployContract(this.signers.owner, extendableArtifact, [this.extend.address])
    );

    const erc721GetterArtifact: Artifact = await artifacts.readArtifact("GetterLogic");
    const erc721GetterLogic = <GetterLogic>await waffle.deployContract(this.signers.admin, erc721GetterArtifact, []);

    const erc721HooksArtifact: Artifact = await artifacts.readArtifact("ERC721HooksLogic");
    const erc721HooksLogic = <ERC721HooksLogic>await waffle.deployContract(this.signers.admin, erc721HooksArtifact, []);

    const humanboundTokenURIArtifact: Artifact = await artifacts.readArtifact("HumanboundTokenURILogic");
    this.humanboundTokenURILogic = <HumanboundTokenURILogic>(
      await waffle.deployContract(this.signers.admin, humanboundTokenURIArtifact)
    );

    const permissionArtifact: Artifact = await artifacts.readArtifact("HumanboundPermissionLogic");
    this.permissioning = <HumanboundPermissionLogic>(
      await waffle.deployContract(this.signers.admin, permissionArtifact, [])
    );

    const gasRefundArtifact: Artifact = await artifacts.readArtifact("GasRefundLogic");
    const refund = <GasRefundLogic>await waffle.deployContract(this.signers.admin, gasRefundArtifact, []);

    const extend = <HumanboundExtendLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundExtendLogic")
    );
    await extend.connect(this.signers.owner).extend(this.permissioning.address);

    const permission = <HumanboundPermissionLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundPermissionLogic")
    );
    await permission.connect(this.signers.owner).updateOperator(this.signers.operator.address);

    await extend.connect(this.signers.operator).extend(this.verifierExtension.address);
    await extend.connect(this.signers.operator).extend(this.mintLogic.address);
    await extend.connect(this.signers.operator).extend(erc721GetterLogic.address);
    await extend.connect(this.signers.operator).extend(erc721HooksLogic.address);
    await extend.connect(this.signers.operator).extend(this.humanboundTokenURILogic.address);
    await extend.connect(this.signers.operator).extend(refund.address);

    const extendableAsVerifierExtension = <EATVerifierConnector>(
      await getExtendedContractWithInterface(this.extendable.address, "EATVerifierConnector")
    );
    await extendableAsVerifierExtension.connect(this.signers.operator).setVerifier(this.verifier.address);

    extendableAsMint = <HumanboundMintLogic>(
      await getExtendedContractWithInterface(this.extendable.address, "HumanboundMintLogic")
    );
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

  describe("TokenURI", async () => {
    const tokenId = 42;
    const baseURI = "violet.co/";
    const tokenURI = "humanbound/";

    context("with minted tokens", async function () {
      beforeEach("mint token", async function () {
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
        ).to.not.be.reverted;
      });

      context("setBaseURI", async function () {
        context("from valid address", async function () {
          it("should set Base URI correctly", async function () {
            await expect(extendableAsTokenURI.connect(this.signers.operator).setBaseURI(baseURI))
              .to.emit(extendableAsTokenURI, "BaseURISet")
              .withArgs(baseURI);
            expect(await extendableAsTokenURI.callStatic.baseURI()).to.equal(baseURI);
            expect(await extendableAsTokenURI.callStatic.tokenURI(tokenId)).to.equal(baseURI);
          });
        });

        context("from invalid address", async function () {
          it("should fail to set Base URI", async function () {
            await expect(extendableAsTokenURI.connect(this.signers.user0).setBaseURI(baseURI)).to.be.revertedWith(
              "SetTokenURI: unauthorised",
            );
            expect(await extendableAsTokenURI.callStatic.baseURI()).to.equal("");
            expect(await extendableAsTokenURI.callStatic.tokenURI(tokenId)).to.equal("");
          });
        });
      });

      context("setTokenURI", async function () {
        context("from valid address", async function () {
          it("should set Token URI correctly", async function () {
            const fullTokenURI = `${tokenURI}${tokenId.toString()}`;
            await expect(extendableAsTokenURI.connect(this.signers.operator).setTokenURI(tokenId, fullTokenURI))
              .to.emit(extendableAsTokenURI, "TokenURISet")
              .withArgs(tokenId, `${tokenURI}${tokenId.toString()}`);
            expect(await extendableAsTokenURI.callStatic.tokenURI(tokenId)).to.equal(fullTokenURI);
          });
        });

        context("from invalid address", async function () {
          it("should fail to set Token URI", async function () {
            await expect(
              extendableAsTokenURI.connect(this.signers.user0).setTokenURI(tokenId, `${tokenURI}${tokenId.toString()}`),
            ).to.be.revertedWith("SetTokenURI: unauthorised");
            expect(await extendableAsTokenURI.callStatic.tokenURI(tokenId)).to.equal("");
          });
        });
      });

      context("getTokenURI", async function () {
        context("with set base URI only", async function () {
          beforeEach("set base URI", async function () {
            await expect(extendableAsTokenURI.connect(this.signers.operator).setBaseURI(baseURI))
              .to.emit(extendableAsTokenURI, "BaseURISet")
              .withArgs(baseURI);
          });

          it("should get Token URI correctly", async function () {
            expect(await extendableAsTokenURI.callStatic.tokenURI(tokenId)).to.equal(`${baseURI}`);
          });
        });

        context("with set token URI only", async function () {
          beforeEach("set token URI", async function () {
            await expect(
              extendableAsTokenURI
                .connect(this.signers.operator)
                .setTokenURI(tokenId, `${tokenURI}${tokenId.toString()}`),
            )
              .to.emit(extendableAsTokenURI, "TokenURISet")
              .withArgs(tokenId, `${tokenURI}${tokenId.toString()}`);
          });

          it("should get Token URI correctly", async function () {
            expect(await extendableAsTokenURI.callStatic.tokenURI(tokenId)).to.equal(
              `${tokenURI}${tokenId.toString()}`,
            );
          });
        });

        context("with set base URI and token URI", async function () {
          beforeEach("set base URI and token URI", async function () {
            await expect(extendableAsTokenURI.connect(this.signers.operator).setBaseURI(baseURI))
              .to.emit(extendableAsTokenURI, "BaseURISet")
              .withArgs(baseURI);
            await expect(
              extendableAsTokenURI
                .connect(this.signers.operator)
                .setTokenURI(tokenId, `${tokenURI}${tokenId.toString()}`),
            )
              .to.emit(extendableAsTokenURI, "TokenURISet")
              .withArgs(tokenId, `${tokenURI}${tokenId.toString()}`);
          });

          it("should get Token URI correctly", async function () {
            expect(await extendableAsTokenURI.callStatic.tokenURI(tokenId)).to.equal(
              `${tokenURI}${tokenId.toString()}`,
            );
          });
        });
      });
    });
  });
}
