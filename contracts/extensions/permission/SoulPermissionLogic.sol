// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import { SoulPermissionState, SoulPermissionStorage } from "../../storage/SoulPermissionStorage.sol";
import "./ISoulPermissionLogic.sol";

contract SoulPermissionLogic is SoulPermissionExtension {
    function updateOperator(address newOperator) external onlyOwner {
        SoulPermissionState storage state = SoulPermissionStorage._getState();
        address oldOperator = state.operator;

        state.operator = newOperator;
        emit OperatorUpdated(oldOperator, newOperator);
    }

    function getOperator() external view returns (address) {
        SoulPermissionState storage state = SoulPermissionStorage._getState();
        return state.operator;
    }
}
