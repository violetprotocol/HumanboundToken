// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import { SoulPermissionState, SoulPermissionStorage } from "../../storage/SoulPermissionStorage.sol";
import { GasRefundState, GasRefundStorage } from "../../storage/GasRefundStorage.sol";
import "./IGasRefundLogic.sol";
import "hardhat/console.sol";

contract GasRefunder {
    modifier refunds() virtual {
        uint256 startGas = gasleft();
        _;
        IGasRefund(address(this)).refundExecution(startGas - gasleft());
    }
}
