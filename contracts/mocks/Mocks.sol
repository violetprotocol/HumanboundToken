// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/extendable/extensions/extend/ExtendLogic.sol";
import "@violetprotocol/extendable/extensions/retract/RetractLogic.sol";
import "@violetprotocol/extendable/extensions/replace/ReplaceLogic.sol";
import "@violetprotocol/ethereum-access-token/contracts/AccessTokenVerifier.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/approve/ApproveLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/getter/GetterLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/hooks/ERC721HooksLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/metadata/setTokenURI/SetTokenURILogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/metadata/setTokenURI/BasicSetTokenURILogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/metadata/getter/MetadataGetterLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/receiver/OnReceiveLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/approve/ApproveLogic.sol";
import "../extensions/refund/IGasRefundLogic.sol";

abstract contract MockVerifier is AccessTokenVerifier {}

abstract contract MockExtend is ExtendLogic {}

contract MockRetractLogic is RetractLogic {}

contract MockReplaceLogic is ReplaceLogic {}

contract MockApprove is ApproveLogic {}

contract MockERC721Getter is GetterLogic {}

contract MockERC721Hooks is ERC721HooksLogic {}

contract MockSetTokenURI is SetTokenURILogic {}

contract MockBasicTokenURI is BasicSetTokenURILogic {}

contract MockMetadataGetterLogic is MetadataGetterLogic {}

contract MockOnReceive is OnReceiveLogic {}

interface IMockInternalExtend {
    function internalExtend(address extension) external;
}

contract MockInternalExtend is IMockInternalExtend, Extension {
    function internalExtend(address extension) public override {
        IExtendLogic(address(this)).extend(extension);
    }

    function getSolidityInterface() public pure virtual override returns (string memory) {
        return "function internalExtend(address extension) external;\n";
    }

    /**
     * @dev see {IExtension-getInterface}
     */
    function getInterface() public virtual override returns (Interface[] memory interfaces) {
        interfaces = new Interface[](1);

        bytes4[] memory functions = new bytes4[](1);
        functions[0] = IMockInternalExtend.internalExtend.selector;

        interfaces[0] = Interface(type(IMockInternalExtend).interfaceId, functions);
    }
}

interface IMockExtension {
    function hashing(uint256 times) external;
}

abstract contract MockExtension is IMockExtension, Extension {
    function getSolidityInterface() public pure virtual override returns (string memory) {
        return "function hashing(uint256 times) external;\n";
    }

    /**
     * @dev see {IExtension-getInterface}
     */
    function getInterface() public virtual override returns (Interface[] memory interfaces) {
        interfaces = new Interface[](1);

        bytes4[] memory functions = new bytes4[](1);
        functions[0] = IMockExtension.hashing.selector;

        interfaces[0] = Interface(type(IMockExtension).interfaceId, functions);
    }
}

contract MockRefund is MockExtension {
    function hashing(uint256 times) external override {
        string memory randomString = "MockExtension:hashing";

        bytes32 res = keccak256(bytes(randomString));
        for (uint256 i = 0; i < times; i++) {
            res = keccak256(abi.encode(res));
        }

        IGasRefund(address(this)).refundExecution(299223);
    }
}
