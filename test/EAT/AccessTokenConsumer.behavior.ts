import { splitSignature } from "@ethersproject/bytes";
import { utils } from "@violetprotocol/ethereum-access-token-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import { AccessTokenConsumerCaller, EATVerifierConnector, RequiresAuthExtension } from "../../src/types";
import { getExtendedContractWithInterface } from "../utils/utils";

export function shouldBehaveLikeEthereumAccessToken(): void {
  let consumerCallerAsVerifierSetter: EATVerifierConnector;

  beforeEach("setup", async function () {
    const consumerCallerArtifact: Artifact = await artifacts.readArtifact("AccessTokenConsumerCaller");
    this.consumerCaller = <AccessTokenConsumerCaller>(
      await waffle.deployContract(this.signers.admin, consumerCallerArtifact, [
        this.extend.address,
        this.verifierExtension.address,
        this.requiresAuth.address,
      ])
    );
    consumerCallerAsVerifierSetter = <EATVerifierConnector>(
      await getExtendedContractWithInterface(this.consumerCaller.address, "EATVerifierConnector")
    );
  });

  describe("Set Verifier", async function () {
    context("with correct owner", async function () {
      it("should succed", async function () {
        await expect(consumerCallerAsVerifierSetter.setVerifier(this.verifier.address)).to.not.be.reverted;
        expect(await consumerCallerAsVerifierSetter.callStatic.getVerifier()).to.equal(this.verifier.address);
      });
    });

    context("with incorrect owner", async function () {
      it("should fail", async function () {
        await expect(
          consumerCallerAsVerifierSetter.connect(this.signers.user0).setVerifier(this.verifier.address),
        ).to.be.revertedWith("EATVerifierConnector: unauthorised");
      });
    });
  });

  describe("Get Verifier", async () => {
    context("without set verifier", async function () {
      it("should return zero address", async function () {
        expect(await consumerCallerAsVerifierSetter.callStatic.getVerifier()).to.equal(ethers.constants.AddressZero);
      });
    });

    context("with set verifier", async function () {
      it("should return the correct verifier", async function () {
        await expect(consumerCallerAsVerifierSetter.setVerifier(this.verifier.address)).to.not.be.reverted;
        expect(await consumerCallerAsVerifierSetter.callStatic.getVerifier()).to.equal(this.verifier.address);
      });
    });
  });

  describe("Requires Auth", async () => {
    let requiresAuthExtension: RequiresAuthExtension;

    before("setup", async function () {
      requiresAuthExtension = <RequiresAuthExtension>(
        await getExtendedContractWithInterface(this.consumerCaller.address, "RequiresAuthExtension")
      );
    });

    describe("sign and verify", async () => {
      context("when calling function", async function () {
        context("with parameters", async function () {
          describe("string, bytes calldata, address, uint256, bytes calldata", async function () {
            before("construct token", async function () {
              this.params = ["some string", "0xaaaaaaaaaaaaaa", this.signers.user0.address, 42, "0xbbbbbbbbbbbb"];
              this.value = {
                expiry: BigNumber.from(Math.floor(new Date().getTime() / 1000) + 50000),
                functionCall: {
                  functionSignature: requiresAuthExtension.interface.getSighash("doSomething"),
                  target: this.consumerCaller.address,
                  caller: this.signers.admin.address,
                  parameters: utils.packParameters(requiresAuthExtension.interface, "doSomething", []),
                },
              };
              this.signature = splitSignature(await utils.signAccessToken(this.signers.admin, this.domain, this.value));
            });

            it("with correct values should succeed", async function () {
              await expect(
                requiresAuthExtension.doSomething(
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry,
                ),
              ).to.not.be.reverted;
            });

            it("with incorrect caller should revert", async function () {
              await expect(
                requiresAuthExtension
                  .connect(this.signers.user1)
                  .doSomething(this.signature.v, this.signature.r, this.signature.s, this.value.expiry),
              ).to.be.revertedWith("AccessToken: verification failure");
            });

            it("with expired token should revert", async function () {
              await expect(
                requiresAuthExtension.doSomething(
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry.sub(50000),
                ),
              ).to.be.revertedWith("AccessToken: has expired");
            });

            it("with incorrect expiry should revert", async function () {
              await expect(
                requiresAuthExtension.doSomething(
                  this.signature.v,
                  this.signature.r,
                  this.signature.s,
                  this.value.expiry.add(50),
                ),
              ).to.be.revertedWith("AccessToken: verification failure");
            });

            it("with incorrect signer should revert", async function () {
              const signature = splitSignature(
                await utils.signAccessToken(this.signers.user0, this.domain, this.value),
              );

              await expect(
                requiresAuthExtension.doSomething(signature.v, signature.r, signature.s, this.value.expiry),
              ).to.be.revertedWith("AccessToken: verification failure");
            });

            it("with incorrect function signature should revert", async function () {
              const signature = splitSignature(
                await utils.signAccessToken(this.signers.admin, this.domain, {
                  ...this.value,
                  functionCall: {
                    ...this.value.functionCall,
                    functionSignature: "0xdeadbeef",
                  },
                }),
              );

              await expect(
                requiresAuthExtension.doSomething(signature.v, signature.r, signature.s, this.value.expiry),
              ).to.be.revertedWith("AccessToken: verification failure");
            });

            it("with incorrect target contract should revert", async function () {
              const signature = splitSignature(
                await utils.signAccessToken(this.signers.admin, this.domain, {
                  ...this.value,
                  functionCall: {
                    ...this.value.functionCall,
                    target: this.signers.admin.address,
                  },
                }),
              );

              await expect(
                requiresAuthExtension.doSomething(signature.v, signature.r, signature.s, this.value.expiry),
              ).to.be.revertedWith("AccessToken: verification failure");
            });
          });
        });
      });
    });
  });
}
