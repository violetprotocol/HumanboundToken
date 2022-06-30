// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

interface ISoulBurnLogic {
    function burn(uint256 tokenId, string memory burnProofURI) external;

    function burn(uint256 tokenId) external;
}
