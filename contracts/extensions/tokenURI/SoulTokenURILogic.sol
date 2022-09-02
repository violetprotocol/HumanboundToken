// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "@violetprotocol/erc721extendable/contracts/extensions/base/mint/MintLogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/metadata/setTokenURI/PermissionedSetTokenURILogic.sol";
import "@violetprotocol/erc721extendable/contracts/extensions/metadata/getter/MetadataGetterLogic.sol";
import { SoulPermissionState, SoulPermissionStorage } from "../../storage/SoulPermissionStorage.sol";
import "../EAT/AccessTokenConsumerExtension.sol";

contract SoulTokenURILogic is BasicSetTokenURILogic, MetadataGetterLogic {
    event BaseURISet(string newBaseURI);
    event TokenURISet(uint256 tokenId, string newTokenURI);

    modifier onlyOperator() virtual {
        SoulPermissionState storage state = SoulPermissionStorage._getState();
        require(_lastExternalCaller() == state.operator || msg.sender == state.operator, "SetTokenURI: unauthorised");
        _;
    }

    function tokenURI(uint256 tokenId) public virtual override(MetadataGetterLogic) returns (string memory) {
        // See {IERC721URIStorage-tokenURI}
        require(IGetterLogic(address(this))._exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");

        TokenURIState storage state = TokenURIStorage._getState();

        string memory _tokenURI = state._tokenURIs[tokenId];
        // If tokenURI is set, return it
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }

        string memory base = _baseURI();
        // If there is no token URI, return the base URI as a generic shared resource
        if (bytes(base).length > 0) {
            return _baseURI();
        }

        // If neither are set, return blank
        return "";
    }

    function setBaseURI(string memory baseURI) public override onlyOperator {
        super.setBaseURI(baseURI);
        emit BaseURISet(baseURI);
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public override onlyOperator {
        super.setTokenURI(tokenId, _tokenURI);
        emit TokenURISet(tokenId, _tokenURI);
    }

    function getInterfaceId()
        public
        pure
        virtual
        override(BasicSetTokenURILogic, MetadataGetterLogic)
        returns (bytes4)
    {
        return (type(IBasicSetTokenURILogic).interfaceId ^ type(IMetadataGetterLogic).interfaceId);
    }

    function getInterface()
        public
        pure
        virtual
        override(BasicSetTokenURILogic, MetadataGetterLogic)
        returns (string memory)
    {
        return string(abi.encodePacked(BasicSetTokenURILogic.getInterface(), MetadataGetterLogic.getInterface()));
    }
}
