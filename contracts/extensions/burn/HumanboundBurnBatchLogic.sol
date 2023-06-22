// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "./IHumanboundBurnBatchLogic.sol";

contract HumanboundBurnBatchLogic is HumanboundBurnBatchExtension {
    function burnBatch(uint256[] memory tokenIds, string memory burnProofURI) external onlyOperator {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            try this.burn(tokenIds[i], burnProofURI) {
                // success, do nothing
            } catch (bytes memory) {
                // failed, do nothing, try next
            }
        }
    }
}
