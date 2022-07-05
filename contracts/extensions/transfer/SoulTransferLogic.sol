// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/erc721extendable/contracts/extensions/base/transfer/TransferLogic.sol";
import "../EAT/AccessTokenConsumerExtension.sol";
import "./ISoulTransferLogic.sol";

contract SoulTransferLogic is ISoulTransferLogic, TransferLogic, AccessTokenConsumerExtension {
    /**
     * @dev See {ITransferLogic-transferFrom}.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        revert("SoulTransferLogic-transferFrom: disallowed without EAT");
    }

    /**
     * @dev See {ITransferLogic-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        revert("SoulTransferLogic-safeTransferFrom: disallowed without EAT");
    }

    /**
     * @dev See {ITransferLogic-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public virtual override {
        revert("SoulTransferLogic-safeTransferFrom: disallowed without EAT");
    }

    function transferFrom(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry,
        address from,
        address to,
        uint256 tokenId
    ) public override(ISoulTransferLogic) requiresAuth(v, r, s, expiry) {
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry,
        address from,
        address to,
        uint256 tokenId
    ) public override(ISoulTransferLogic) requiresAuth(v, r, s, expiry) {
        _safeTransfer(from, to, tokenId, "");
    }

    function safeTransferFrom(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry,
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override(ISoulTransferLogic) requiresAuth(v, r, s, expiry) {
        _safeTransfer(from, to, tokenId, data);
    }

    function getInterfaceId() public pure virtual override(TransferLogic, Extension) returns (bytes4) {
        return (type(ISoulTransferLogic).interfaceId);
    }

    function getInterface() public pure virtual override(TransferLogic, IExtension) returns (string memory) {
        return
            string(
                abi.encodePacked(
                    TransferLogic.getInterface(),
                    "function transferFrom(uint8 v, bytes32 r, bytes32 s, uint256 expiry, address from, address to, uint256 tokenId) external;\n"
                    "function safeTransferFrom(uint8 v, bytes32 r, bytes32 s, uint256 expiry, address from, address to, uint256 tokenId) external;\n"
                    "function safeTransferFrom(uint8 v, bytes32 r, bytes32 s, uint256 expiry, address from, address to, uint256 tokenId, bytes memory data) external;\n"
                )
            );
    }
}