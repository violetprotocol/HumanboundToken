// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/extendable/extensions/extend/ExtendLogic.sol";
import "@violetprotocol/ethereum-access-token/contracts/AuthVerifier.sol";

abstract contract MockVerifier is AuthVerifier {}

abstract contract MockExtend is ExtendLogic {}
