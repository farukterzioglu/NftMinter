// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNft is ERC721, ERC721Enumerable, ERC721URIStorage, Pausable, Ownable {

    string internal _baseUri = "";
    constructor(string memory name, string memory symbol, string memory baseUri) ERC721(name, symbol) {
        _baseUri = baseUri;
    }

    // Base URI
    function _baseURI() internal view override returns (string memory) {
        return _baseUri;
    }

    function setBaseURI(string memory uri) public onlyOwner{
        _baseUri = uri;
    }

    function getBaseURI() public view returns (string memory) {
        return _baseUri;
    }

    // Pausable 
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Minting
    function safeMint(address to, uint256 tokenId) public onlyOwner
    {
        _safeMint(to, tokenId);
    }

    function safeMintWithUri(address to, uint256 tokenId, string memory uri) public onlyOwner
    {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        whenNotPaused
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

contract ExposedMyNft is MyNft {
    constructor() MyNft("Exposed", "EXP", "") {}

    function burn(uint256 tokenId) public {
        return _burn(tokenId);
    }
}