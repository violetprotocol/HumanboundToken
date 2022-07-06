// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/extendable/extensions/extend/ExtendLogic.sol";
import "@violetprotocol/ethereum-access-token/contracts/AccessTokenVerifier.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/approve/ApproveLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/getter/GetterLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/hooks/ERC721HooksLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/metadata/setTokenURI/SetTokenURILogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/metadata/setTokenURI/BasicSetTokenURILogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/metadata/getter/MetadataGetterLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/receiver/OnReceiveLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/approve/ApproveLogic.sol";

abstract contract MockVerifier is AccessTokenVerifier {}

abstract contract MockExtend is ExtendLogic {}

contract MockApprove is ApproveLogic {}

contract MockERC721Getter is GetterLogic {}

contract MockERC721Hooks is ERC721HooksLogic {}

contract MockSetTokenURI is SetTokenURILogic {}

contract MockBasicTokenURI is BasicSetTokenURILogic {}

contract MockMetadataGetterLogic is MetadataGetterLogic {}

contract MockOnReceive is OnReceiveLogic {}
