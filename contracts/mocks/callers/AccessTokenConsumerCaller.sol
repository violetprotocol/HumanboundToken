// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/extendable/extendable/Extendable.sol";
import "@violetprotocol/extendable/extensions/Extension.sol";
import "../../extensions/EAT/IEATVerifierConnector.sol";
import "../../extensions/EAT/AccessTokenConsumerExtension.sol";

interface IRequiresAuthExtension {
    function doSomething(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry
    ) external returns (bool);
}

contract RequiresAuthExtension is IRequiresAuthExtension, AccessTokenConsumerExtension {
    function doSomething(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiry
    ) public override requiresAuth(v, r, s, expiry) returns (bool) {
        return true;
    }

    function getSolidityInterface() public pure override returns (string memory) {
        return "function doSomething(uint8 v, bytes32 r, bytes32 s, uint256 expiry) external returns(bool);\n";
    }

    function getInterface() public pure override returns (Interface[] memory interfaces) {
        interfaces = new Interface[](1);

        bytes4[] memory functions = new bytes4[](1);
        functions[0] = IRequiresAuthExtension.doSomething.selector;

        interfaces[0] = Interface(type(IRequiresAuthExtension).interfaceId, functions);
    }
}

contract AccessTokenConsumerCaller is Extendable {
    constructor(
        address extendLogic,
        address eatVerifierConnector,
        address requiresAuth
    ) Extendable(extendLogic) {
        (bool extendVerifierSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", eatVerifierConnector)
        );
        require(extendVerifierSuccess, "failed to initialise verifier");

        (bool extendRequiresAuthSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", requiresAuth)
        );
        require(extendRequiresAuthSuccess, "failed to initialise requiresAuth");
    }
}
