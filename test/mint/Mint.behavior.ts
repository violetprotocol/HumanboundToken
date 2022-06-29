import { splitSignature } from "@ethersproject/bytes";
import { utils } from "@violetprotocol/ethereum-access-token-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import {
  AccessTokenConsumerCaller,
  EATVerifier,
  ERC721HooksLogic,
  ExtendLogic,
  Extendable,
  GetterLogic,
  IERC721Hooks,
  IGetterLogic,
  RequiresAuthExtension,
  SoulMintLogic,
} from "../../src/types";
import { getExtendedContractWithInterface } from "../utils";

export function shouldBehaveLikeSoulMint(): void {
  let extendableAsMint: SoulMintLogic;
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

    const extend = <ExtendLogic>await getExtendedContractWithInterface(this.extendable.address, "ExtendLogic");
    await extend.extend(this.verifierExtension.address);
    await extend.extend(this.mintLogic.address);
    await extend.extend(erc721GetterLogic.address);
    await extend.extend(erc721HooksLogic.address);

    const extendableAsVerifierExtension = <EATVerifier>(
      await getExtendedContractWithInterface(this.extendable.address, "EATVerifier")
    );
    await extendableAsVerifierExtension.setVerifier(this.verifier.address);

    extendableAsMint = <SoulMintLogic>await getExtendedContractWithInterface(this.extendable.address, "SoulMintLogic");

    extendableAsGetter = <GetterLogic>await getExtendedContractWithInterface(this.extendable.address, "GetterLogic");
  });

  describe("Mint", async () => {
    const tokenId = 42;

    context("with EAT", async () => {
      context("from correct signer", async function () {
        beforeEach("construct token", async function () {
          this.params = [this.signers.user0.address, tokenId];
          this.value = {
            expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 50),
            functionCall: {
              functionSignature: extendableAsMint.interface.getSighash("mint"),
              target: extendableAsMint.address.toLowerCase(),
              caller: this.signers.user0.address.toLowerCase(),
              parameters: utils.packParameters(extendableAsMint.interface, "mint", [
                this.signers.user0.address.toLowerCase(),
                tokenId,
              ]),
            },
          };
          this.signature = splitSignature(await utils.signAuthMessage(this.signers.admin, this.domain, this.value));
        });

        it("should successfully mint to user", async function () {
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
              ),
          ).to.not.be.reverted;

          expect(await extendableAsGetter.callStatic.ownerOf(tokenId)).to.equal(this.signers.user0.address);
        });
      });
    });
  });
}
