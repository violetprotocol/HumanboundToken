// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import { HumanboundPermissionState, HumanboundPermissionStorage } from "../../storage/HumanboundPermissionStorage.sol";
import { GasRefundState, GasRefundStorage } from "../../storage/GasRefundStorage.sol";
import "./IGasRefundLogic.sol";

// Not currently used
contract GasRefunder {
    modifier refunds() virtual {
        uint256 startGas = gasleft();
        _;
        IGasRefund(address(this)).refundExecution(startGas - gasleft());
    }
}
