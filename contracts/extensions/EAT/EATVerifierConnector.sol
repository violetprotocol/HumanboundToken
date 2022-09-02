// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import { SoulPermissionState, SoulPermissionStorage } from "../../storage/SoulPermissionStorage.sol";
import { RoleState, Permissions } from "@violetprotocol/extendable/storage/PermissionStorage.sol";
import "../../storage/EthereumAccessTokenStorage.sol";
import "./IEATVerifierConnector.sol";

contract EATVerifierConnector is IEATVerifierConnector, Extension {
    modifier onlyOperatorOrSelf() virtual {
        SoulPermissionState storage state = SoulPermissionStorage._getState();
        require(
            _lastExternalCaller() == state.operator ||
                _lastCaller() == state.operator ||
                _lastCaller() == address(this),
            "EATVerifierConnector: unauthorised"
        );
        _;
    }

    function setVerifier(address verifier) external override onlyOperatorOrSelf {
        EthereumAccessTokenState storage state = EthereumAccessTokenStorage._getState();
        state.verifier = verifier;
    }

    function getVerifier() public view override returns (address) {
        EthereumAccessTokenState storage state = EthereumAccessTokenStorage._getState();
        return state.verifier;
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IEATVerifierConnector).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function setVerifier(address verifier) external;\n"
            "function getVerifier() external returns(address);\n";
    }
}
