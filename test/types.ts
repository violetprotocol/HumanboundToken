import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import type { Fixture } from "ethereum-waffle";

import {
  AccessTokenConsumerCaller,
  AccessTokenVerifier,
  EATVerifierConnector,
  ExtendLogic,
  RequiresAuthExtension,
  SoulMintLogic,
} from "../src/types";

declare module "mocha" {
  export interface Context {
    extend: ExtendLogic;
    verifier: AccessTokenVerifier;
    verifierExtension: EATVerifierConnector;
    requiresAuth: RequiresAuthExtension;
    consumerCaller: AccessTokenConsumerCaller;
    mintLogic: SoulMintLogic;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
  user0: SignerWithAddress;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
}
