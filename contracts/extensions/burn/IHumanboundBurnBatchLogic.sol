// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "./HumanboundBurnLogic.sol";

interface IHumanboundBurnBatchLogic {
    function burnBatch(uint256[] memory tokenIds, string memory burnProofURI) external;
}

abstract contract HumanboundBurnBatchExtension is HumanboundBurnLogic, IHumanboundBurnBatchLogic {
    /**
     * @dev see {IExtension-getSolidityInterface}
     */
    function getSolidityInterface() public pure virtual override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    super.getSolidityInterface(),
                    "function burnBatch(uint256[] tokenIds, string memory burnProofURI) external;\n"
                )
            );
    }

    /**
     * @dev see {IExtension-getInterface}
     */
    function getInterface() public virtual override returns (Interface[] memory interfaces) {
        interfaces = new Interface[](2);

        bytes4[] memory functions = new bytes4[](1);
        functions[0] = bytes4(keccak256("burnBatch(uint256[],string)"));

        interfaces[1] = super.getInterface()[0];
        interfaces[0] = Interface(type(IHumanboundBurnBatchLogic).interfaceId, functions);
    }
}
