// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/extendable/extendable/Extendable.sol";
import "@violetprotocol/extendable/extensions/Extension.sol";
import "../../extensions/EAT/IAccessTokenConsumer.sol";

interface IRequiresAuthExtension {
    function doSomething(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry
    ) external returns (bool);
}

contract RequiresAuthExtension is IRequiresAuthExtension, Extension {
    function doSomething(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry
    ) public override returns (bool) {
        IAccessTokenConsumer(address(this)).requiresAuth(v, r, s, expiry);
        return true;
    }

    function getInterfaceId() public pure override returns (bytes4) {
        return type(IRequiresAuthExtension).interfaceId;
    }

    function getInterface() public pure override returns (string memory) {
        return "function doSomething(uint8 v, bytes32 r, bytes32 s, uint256 expiry) external returns(bool);\n";
    }
}

contract AccessTokenConsumerCaller is Extendable {
    constructor(
        address extendLogic,
        address consumer,
        address requiresAuth
    ) Extendable(extendLogic) {
        (bool extendConsumerSuccess, ) = extendLogic.delegatecall(abi.encodeWithSignature("extend(address)", consumer));
        require(extendConsumerSuccess, "failed to initialise consumer");

        (bool extendRequiresAuthSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", requiresAuth)
        );
        require(extendRequiresAuthSuccess, "failed to initialise requiresAuth");
    }
}
