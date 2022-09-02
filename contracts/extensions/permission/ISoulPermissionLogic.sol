// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

interface ISoulPermissionLogic {
    /**
     * @dev Emitted when `operator` is updated in any way
     */
    event OperatorUpdated(address oldOperator, address newOperator);

    /**
     * @notice Updates the `owner` to `newOwner`
     */
    function updateOperator(address newOperator) external;

    /**
     * @notice Returns the current `owner`
     */
    function getOperator() external returns (address);
}
