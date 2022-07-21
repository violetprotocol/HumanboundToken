//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@violetprotocol/extendable/extensions/Extension.sol";
import { RoleState, Permissions } from "@violetprotocol/extendable/storage/PermissionStorage.sol";
import "./IRegisterInterfaceLogic.sol";

contract RegisterInterfaceLogic is IRegisterInterfaceLogic, Extension {
    modifier onlyOwner() virtual {
        RoleState storage state = Permissions._getStorage();
        require(_lastExternalCaller() == state.owner, "RegisterInterfaceLogic: unauthorised");
        _;
    }

    function registerInterface(bytes4 interfaceId) public override onlyOwner {
        _registerInterface(interfaceId);
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IRegisterInterfaceLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return "function registerInterface(bytes4 interfaceId) external;\n";
    }
}
