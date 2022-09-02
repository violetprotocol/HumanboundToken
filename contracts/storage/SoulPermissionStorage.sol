//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

struct SoulPermissionState {
    address operator;
}

library SoulPermissionStorage {
    bytes32 constant STORAGE_NAME = keccak256("soultoken:permission");

    function _getState() internal view returns (SoulPermissionState storage permissionState) {
        bytes32 position = keccak256(abi.encodePacked(address(this), STORAGE_NAME));
        assembly {
            permissionState.slot := position
        }
    }
}
