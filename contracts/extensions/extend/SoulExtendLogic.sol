// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/extendable/extensions/extend/ExtendLogic.sol";
import { SoulPermissionState, SoulPermissionStorage } from "../../storage/SoulPermissionStorage.sol";

contract SoulExtendLogic is ExtendLogic {
    modifier onlyOperator() virtual {
        SoulPermissionState storage state = SoulPermissionStorage._getState();
        require(
            _lastExternalCaller() == state.operator || _lastCaller() == state.operator,
            "SoulExtendLogic: unauthorised"
        );
        _;
    }

    // Overrides the previous implementation of modifier to remove owner checks
    modifier onlyOwnerOrSelf() override {
        _;
    }

    function extend(address extension) public override onlyOperator {
        super.extend(extension);
    }
}
