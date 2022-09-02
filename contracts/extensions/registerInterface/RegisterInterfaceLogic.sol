//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@violetprotocol/extendable/extensions/Extension.sol";
import { SoulPermissionState, SoulPermissionStorage } from "../../storage/SoulPermissionStorage.sol";
import "./IRegisterInterfaceLogic.sol";

contract RegisterInterfaceLogic is IRegisterInterfaceLogic, Extension {
    modifier onlyOperator() virtual {
        SoulPermissionState storage state = SoulPermissionStorage._getState();
        require(_lastExternalCaller() == state.operator, "RegisterInterfaceLogic: unauthorised");
        _;
    }

    function registerInterface(bytes4 interfaceId) public override onlyOperator {
        _registerInterface(interfaceId);
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IRegisterInterfaceLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return "function registerInterface(bytes4 interfaceId) external;\n";
    }
}
