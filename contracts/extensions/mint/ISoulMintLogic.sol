// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

interface ISoulMintLogic {
    function mint(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry,
        address to,
        uint256 tokenId,
        string calldata tokenURI
    ) external;
}
