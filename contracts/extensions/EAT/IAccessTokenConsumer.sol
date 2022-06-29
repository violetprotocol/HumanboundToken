// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

interface IAccessTokenConsumer {
    function setVerifier(address verifier) external;

    function getVerifier() external returns (address);

    function requiresAuth(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry
    ) external;
}
