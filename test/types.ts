import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import type { Fixture } from "ethereum-waffle";

import {
  AccessTokenConsumer,
  AccessTokenConsumerCaller,
  AuthVerifier,
  ExtendLogic,
  RequiresAuthExtension,
} from "../src/types";

declare module "mocha" {
  export interface Context {
    extend: ExtendLogic;
    verifier: AuthVerifier;
    consumer: AccessTokenConsumer;
    requiresAuth: RequiresAuthExtension;
    consumerCaller: AccessTokenConsumerCaller;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
  user0: SignerWithAddress;
  user1: SignerWithAddress;
}
