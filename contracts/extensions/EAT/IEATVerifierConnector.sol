// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

interface IEATVerifierConnector {
    function setVerifier(address verifier) external;

    function getVerifier() external returns (address);
}
