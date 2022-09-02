// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import { SoulPermissionState, SoulPermissionStorage } from "../../storage/SoulPermissionStorage.sol";
import "@violetprotocol/extendable/extensions/permissioning/PermissioningLogic.sol";
import "./ISoulPermissionLogic.sol";

contract SoulPermissionLogic is ISoulPermissionLogic, PermissioningLogic {
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

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(ISoulPermissionLogic).interfaceId ^ super.getInterfaceId());
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    super.getInterface(),
                    "function updateOperator(address newOperator) external;\n"
                    "function getOperator() external returns(address);\n"
                )
            );
    }
}
