// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import { RoleState, Permissions } from "@violetprotocol/extendable/storage/PermissionStorage.sol";
import "../../storage/EthereumAccessTokenStorage.sol";
import "./IEATVerifierConnector.sol";

contract EATVerifierConnector is IEATVerifierConnector, Extension {
    modifier onlyOwnerOrSelf() virtual {
        RoleState storage state = Permissions._getStorage();
        require(
            _lastExternalCaller() == state.owner || _lastCaller() == state.owner || _lastCaller() == address(this),
            "EATVerifierConnector: unauthorised"
        );
        _;
    }

    function setVerifier(address verifier) external override onlyOwnerOrSelf {
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
