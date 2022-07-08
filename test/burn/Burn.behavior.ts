import { splitSignature } from "@ethersproject/bytes";
import { utils } from "@violetprotocol/ethereum-access-token-helpers";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import {
  ApproveLogic,
  EATVerifierConnector,
  ERC721HooksLogic,
  ExtendLogic,
  Extendable,
  GetterLogic,
  SetTokenURILogic,
  SoulBurnLogic,
  SoulMintLogic,
} from "../../src/types";
import { getExtendedContractWithInterface } from "../utils";

export function shouldBehaveLikeSoulBurn(): void {
  let extendableAsMint: SoulMintLogic;
  let extendableAsBurn: SoulBurnLogic;
  let extendableAsGetter: GetterLogic;

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

    const approveArtifact: Artifact = await artifacts.readArtifact("ApproveLogic");
    const approveLogic = <ApproveLogic>await waffle.deployContract(this.signers.admin, approveArtifact);

    const burnArtifact: Artifact = await artifacts.readArtifact("SoulBurnLogic");
    this.burnLogic = <SoulBurnLogic>await waffle.deployContract(this.signers.admin, burnArtifact);

    const extend = <ExtendLogic>await getExtendedContractWithInterface(this.extendable.address, "ExtendLogic");
    await extend.extend(this.verifierExtension.address);
    await extend.extend(this.mintLogic.address);
    await extend.extend(erc721GetterLogic.address);
    await extend.extend(erc721HooksLogic.address);
    await extend.extend(setTokenURILogic.address);
    await extend.extend(approveLogic.address);
    await extend.extend(this.burnLogic.address);

    const extendableAsVerifierExtension = <EATVerifierConnector>(
      await getExtendedContractWithInterface(this.extendable.address, "EATVerifierConnector")
    );
    await extendableAsVerifierExtension.setVerifier(this.verifier.address);

    extendableAsMint = <SoulMintLogic>await getExtendedContractWithInterface(this.extendable.address, "SoulMintLogic");
    extendableAsBurn = <SoulBurnLogic>await getExtendedContractWithInterface(this.extendable.address, "SoulBurnLogic");
    extendableAsGetter = <GetterLogic>await getExtendedContractWithInterface(this.extendable.address, "GetterLogic");
  });

  describe("Burn", async () => {
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

      context("burn", async function () {
        context("as user owner", async function () {
          it("should burn token successfully", async function () {
            await expect(extendableAsBurn.connect(this.signers.user0)["burn(uint256)"](tokenId))
              .to.emit(extendableAsBurn, "BurntByOwner")
              .withArgs(tokenId);
            await expect(extendableAsGetter.callStatic.ownerOf(tokenId)).to.be.revertedWith(
              "ERC721: owner query for nonexistent token",
            );
          });
        });

        context("as contract owner", async function () {
          it("should burn token successfully", async function () {
            await expect(extendableAsBurn["burn(uint256,string)"](tokenId, burnProofURI))
              .to.emit(extendableAsBurn, "BurntWithProof")
              .withArgs(tokenId, burnProofURI);
            await expect(extendableAsGetter.callStatic.ownerOf(tokenId)).to.be.revertedWith(
              "ERC721: owner query for nonexistent token",
            );
          });
        });

        context("as invalid user", async function () {
          it("should fail to burn token", async function () {
            await expect(
              extendableAsBurn.connect(this.signers.user1)["burn(uint256,string)"](tokenId, burnProofURI),
            ).to.be.revertedWith("SoulBurnLogic: unauthorised");
            await expect(extendableAsBurn.connect(this.signers.user1)["burn(uint256)"](tokenId)).to.be.revertedWith(
              "SoulBurnLogic: not token owner",
            );
            expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
          });
        });
      });
    });
  });
}
