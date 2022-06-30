import { splitSignature } from "@ethersproject/bytes";
import { utils } from "@violetprotocol/ethereum-access-token-helpers";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import {
  EATVerifier,
  ERC721HooksLogic,
  ExtendLogic,
  Extendable,
  GetterLogic,
  SoulMintLogic,
  TokenURILogic,
} from "../../src/types";
import { getExtendedContractWithInterface } from "../utils";

export function shouldBehaveLikeTokenURI(): void {
  let extendableAsMint: SoulMintLogic;
  let extendableAsTokenURI: TokenURILogic;

  beforeEach("setup", async function () {
    const extendableArtifact: Artifact = await artifacts.readArtifact("Extendable");
    this.extendable = <Extendable>(
      await waffle.deployContract(this.signers.admin, extendableArtifact, [this.extend.address])
    );

    const erc721GetterArtifact: Artifact = await artifacts.readArtifact("GetterLogic");
    const erc721GetterLogic = <GetterLogic>await waffle.deployContract(this.signers.admin, erc721GetterArtifact, []);

    const erc721HooksArtifact: Artifact = await artifacts.readArtifact("ERC721HooksLogic");
    const erc721HooksLogic = <ERC721HooksLogic>await waffle.deployContract(this.signers.admin, erc721HooksArtifact, []);

    const tokenURIArtifact: Artifact = await artifacts.readArtifact("TokenURILogic");
    this.tokenURILogic = <TokenURILogic>await waffle.deployContract(this.signers.admin, tokenURIArtifact);

    const extend = <ExtendLogic>await getExtendedContractWithInterface(this.extendable.address, "ExtendLogic");
    await extend.extend(this.verifierExtension.address);
    await extend.extend(this.mintLogic.address);
    await extend.extend(erc721GetterLogic.address);
    await extend.extend(erc721HooksLogic.address);
    await extend.extend(this.tokenURILogic.address);

    const extendableAsVerifierExtension = <EATVerifier>(
      await getExtendedContractWithInterface(this.extendable.address, "EATVerifier")
    );
    await extendableAsVerifierExtension.setVerifier(this.verifier.address);

    extendableAsMint = <SoulMintLogic>await getExtendedContractWithInterface(this.extendable.address, "SoulMintLogic");
    extendableAsTokenURI = <TokenURILogic>(
      await getExtendedContractWithInterface(this.extendable.address, "TokenURILogic")
    );
  });

  describe("TokenURI", async () => {
    const tokenId = 42;
    const baseURI = "violet.co/";
    const tokenURI = "soul/";

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
            await expect(extendableAsTokenURI.setBaseURI(baseURI))
              .to.emit(extendableAsTokenURI, "BaseURISet")
              .withArgs(baseURI);
            expect(await extendableAsTokenURI.callStatic.baseURI()).to.equal(baseURI);
            expect(await extendableAsTokenURI.callStatic.tokenURI(tokenId)).to.equal(`${baseURI}${tokenId.toString()}`);
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
            await expect(
              extendableAsTokenURI.setTokenURI(tokenId, `${tokenURI}${tokenId.toString()}`),
            ).to.not.be.reverted;
            expect(await extendableAsTokenURI.callStatic.tokenURI(tokenId)).to.equal(
              `${tokenURI}${tokenId.toString()}`,
            );
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
        context("with set base URI and token URI", async function () {
          beforeEach("set base URI and token URI", async function () {
            await expect(extendableAsTokenURI.setBaseURI(baseURI))
              .to.emit(extendableAsTokenURI, "BaseURISet")
              .withArgs(baseURI);
            await expect(
              extendableAsTokenURI.setTokenURI(tokenId, `${tokenURI}${tokenId.toString()}`),
            ).to.not.be.reverted;
          });

          it("should get Token URI correctly", async function () {
            expect(await extendableAsTokenURI.callStatic.tokenURI(tokenId)).to.equal(
              `${baseURI}${tokenURI}${tokenId.toString()}`,
            );
          });
        });
      });
    });
  });
}
