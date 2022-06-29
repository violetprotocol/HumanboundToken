// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/erc721extendable/contracts/extensions/base/mint/MintLogic.sol";
import "../EAT/AccessTokenConsumerExtension.sol";
import "./ISoulMintLogic.sol";

contract SoulMintLogic is ISoulMintLogic, MintLogic, AccessTokenConsumerExtension {
    function mint(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry,
        address to,
        uint256 tokenId
    ) public override requiresAuth(v, r, s, expiry) {
        _mint(to, tokenId);
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(ISoulMintLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return "function mint(uint8 v, bytes32 r, bytes32 s, uint256 expiry, address to, uint256 tokenId) external;\n";
    }
}
