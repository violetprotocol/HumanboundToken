// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/extendable/extensions/InternalExtension.sol";
import { RoleState, Permissions } from "@violetprotocol/extendable/storage/PermissionStorage.sol";
import "@violetprotocol/ethereum-access-token/contracts/AuthCompatible.sol";
import "../../storage/EthereumAccessTokenStorage.sol";
import "./IEATVerifier.sol";
import "hardhat/console.sol";

abstract contract AccessTokenConsumerExtension is Extension {
    modifier requiresAuth(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry
    ) {
        require(_verify(v, r, s, expiry), "AuthToken: verification failure");
        _;
    }

    function _verify(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry
    ) internal returns (bool) {
        AuthToken memory token = constructToken(expiry);
        address verifier = IEATVerifier(address(this)).getVerifier();
        return IAuthVerifier(verifier).verify(token, v, r, s);
    }

    function constructToken(uint256 expiry) internal view returns (AuthToken memory token) {
        FunctionCall memory functionCall;
        functionCall.functionSignature = msg.sig;
        functionCall.target = address(this);
        functionCall.caller = msg.sender;

        functionCall.parameters = extractInputs();
        token.functionCall = functionCall;
        token.expiry = expiry;
    }

    // Takes calldata and extracts non-signature, non-expiry function inputs as a byte array
    // Removes all references to the proof object except any offsets related to
    // other inputs that are pushed by the proof
    function extractInputs() public pure returns (bytes memory inputs) {
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())
            mstore(0x40, add(ptr, calldatasize()))

            let startPos := 0x04
            let endOfSigExp := add(startPos, 0x80)
            let totalInputSize := sub(calldatasize(), endOfSigExp)

            // Overwrite data to calldata pointer
            inputs := ptr

            // Store expected length of total byte array as first value
            mstore(inputs, totalInputSize)

            // Copy bytes from end of signature and expiry section to end of calldata
            calldatacopy(add(inputs, 0x20), endOfSigExp, totalInputSize)
        }
    }
}
