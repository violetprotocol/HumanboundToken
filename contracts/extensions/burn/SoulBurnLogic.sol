// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import { RoleState, Permissions } from "@violetprotocol/extendable/storage/PermissionStorage.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/burn/BurnLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/base/getter/IGetterLogic.sol";
import "./ISoulBurnLogic.sol";

contract SoulBurnLogic is ISoulBurnLogic, BurnLogic {
    event BurntWithProof(uint256 tokenId, string burnProofURI);
    event BurntByOwner(uint256 tokenId);

    modifier onlyOwner() virtual {
        RoleState storage state = Permissions._getStorage();
        require(_lastExternalCaller() == state.owner, "SoulBurn: unauthorised");
        _;
    }

    function burn(uint256 tokenId, string memory burnProofURI) public onlyOwner {
        _burn(tokenId);

        emit BurntWithProof(tokenId, burnProofURI);
    }

    function burn(uint256 tokenId) public {
        require(msg.sender == IGetterLogic(address(this)).ownerOf(tokenId), "SoulBurn: not token owner");

        _burn(tokenId);

        emit BurntByOwner(tokenId);
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(ISoulBurnLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function burn(uint256 tokenId, string memory burnProofURI) external;\n"
            "function burn(uint256 tokenId) external;\n";
    }
}
