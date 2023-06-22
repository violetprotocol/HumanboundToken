import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import type { Fixture } from "ethereum-waffle";

import {
  AccessTokenConsumerCaller,
  AccessTokenVerifier,
  EATVerifierConnector,
  ExtendLogic,
  HumanboundExtendLogic,
  HumanboundMintLogic,
  HumanboundPermissionLogic,
  RequiresAuthExtension,
} from "../src/types";

declare module "mocha" {
  export interface Context {
    extend: HumanboundExtendLogic;
    permissioning: HumanboundPermissionLogic;
    verifier: AccessTokenVerifier;
    verifierExtension: EATVerifierConnector;
    requiresAuth: RequiresAuthExtension;
    consumerCaller: AccessTokenConsumerCaller;
    mintLogic: HumanboundMintLogic;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
  owner: SignerWithAddress;
  operator: SignerWithAddress;
  user0: SignerWithAddress;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
  user3: SignerWithAddress;
}
