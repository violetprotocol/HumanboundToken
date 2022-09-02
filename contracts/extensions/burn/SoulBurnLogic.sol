// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/erc721extendable/contracts/extensions/base/getter/IGetterLogic.sol";
import { SoulPermissionState, SoulPermissionStorage } from "../../storage/SoulPermissionStorage.sol";
import "./ISoulBurnLogic.sol";

contract SoulBurnLogic is SoulBurnExtension, Burn {
    modifier onlyOperator() virtual {
        SoulPermissionState storage state = SoulPermissionStorage._getState();
        require(_lastExternalCaller() == state.operator, "SoulBurnLogic: unauthorised");
        _;
    }

    function burn(uint256 tokenId, string memory burnProofURI) external onlyOperator {
        _burn(tokenId);

        emit BurntWithProof(tokenId, burnProofURI);
    }

    function burn(uint256 tokenId) external {
        require(msg.sender == IGetterLogic(address(this)).ownerOf(tokenId), "SoulBurnLogic: not token owner");

        _burn(tokenId);

        emit BurntByOwner(tokenId);
    }
}
