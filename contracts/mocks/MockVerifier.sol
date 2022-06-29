// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/extendable/extensions/extend/ExtendLogic.sol";
import "@violetprotocol/ethereum-access-token/contracts/AuthVerifier.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/getter/GetterLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/hooks/ERC721HooksLogic.sol";

abstract contract MockVerifier is AuthVerifier {}

abstract contract MockExtend is ExtendLogic {}

contract MockERC721Getter is GetterLogic {}

contract MockERC721Hooks is ERC721HooksLogic {}
