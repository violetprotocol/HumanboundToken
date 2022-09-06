import { splitSignature } from "@ethersproject/bytes";
import { utils } from "@violetprotocol/ethereum-access-token-helpers";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import {
  EATVerifierConnector,
  ERC721HooksLogic,
  ExtendLogic,
  Extendable,
  GetterLogic,
  SetTokenURILogic,
  SoulMintLogic,
} from "../../src/types";
import { SoulTokenURILogic } from "../../src/types/contracts/extensions/tokenURI/SoulTokenURILogic";
import { getExtendedContractWithInterface } from "../utils/utils";

export function shouldBehaveLikeTokenURI(): void {
  let extendableAsMint: SoulMintLogic;
  let extendableAsTokenURI: SoulTokenURILogic;

  beforeEach("setup", async function () {
    const extendableArtifact: Artifact = await artifacts.readArtifact("Extendable");
    this.extendable = <Extendable>(
      await waffle.deployContract(this.signers.admin, extendableArtifact, [this.extend.address])
    );

    const erc721GetterArtifact: Artifact = await artifacts.readArtifact("GetterLogic");
    const erc721GetterLogic = <GetterLogic>await waffle.deployContract(this.signers.admin, erc721GetterArtifact, []);

    const erc721HooksArtifact: Artifact = await artifacts.readArtifact("ERC721HooksLogic");
    const erc721HooksLogic = <ERC721HooksLogic>await waffle.deployContract(this.signers.admin, erc721HooksArtifact, []);

    const soulTokenURIArtifact: Artifact = await artifacts.readArtifact("SoulTokenURILogic");
    this.soulTokenURILogic = <SoulTokenURILogic>await waffle.deployContract(this.signers.admin, soulTokenURIArtifact);

    const setTokenURIArtifact: Artifact = await artifacts.readArtifact("SetTokenURILogic");
    const setTokenURILogic = <SetTokenURILogic>await waffle.deployContract(this.signers.admin, setTokenURIArtifact);

    const extend = <ExtendLogic>await getExtendedContractWithInterface(this.extendable.address, "ExtendLogic");
    await extend.extend(this.verifierExtension.address);
    await extend.extend(this.mintLogic.address);
    await extend.extend(erc721GetterLogic.address);
    await extend.extend(erc721HooksLogic.address);
    await extend.extend(setTokenURILogic.address);
    await extend.extend(this.soulTokenURILogic.address);

    const extendableAsVerifierExtension = <EATVerifierConnector>(
      await getExtendedContractWithInterface(this.extendable.address, "EATVerifierConnector")
    );
    await extendableAsVerifierExtension.setVerifier(this.verifier.address);

    extendableAsMint = <SoulMintLogic>await getExtendedContractWithInterface(this.extendable.address, "SoulMintLogic");
    extendableAsTokenURI = <SoulTokenURILogic>(
      await getExtendedContractWithInterface(this.extendable.address, "SoulTokenURILogic")
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
            await expect(extendableAsTokenURI.setTokenURI(tokenId, fullTokenURI))
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
            await expect(extendableAsTokenURI.setBaseURI(baseURI))
              .to.emit(extendableAsTokenURI, "BaseURISet")
              .withArgs(baseURI);
          });

          it("should get Token URI correctly", async function () {
            expect(await extendableAsTokenURI.callStatic.tokenURI(tokenId)).to.equal(`${baseURI}`);
          });
        });

        context("with set token URI only", async function () {
          beforeEach("set token URI", async function () {
            await expect(extendableAsTokenURI.setTokenURI(tokenId, `${tokenURI}${tokenId.toString()}`))
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
            await expect(extendableAsTokenURI.setBaseURI(baseURI))
              .to.emit(extendableAsTokenURI, "BaseURISet")
              .withArgs(baseURI);
            await expect(extendableAsTokenURI.setTokenURI(tokenId, `${tokenURI}${tokenId.toString()}`))
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
