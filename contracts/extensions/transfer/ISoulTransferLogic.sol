// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

interface ISoulTransferLogic {
    function transferFrom(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry,
        address from,
        address to,
        uint256 tokenId
    ) external;

    function safeTransferFrom(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry,
        address from,
        address to,
        uint256 tokenId
    ) external;

    function safeTransferFrom(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry,
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) external;
}
