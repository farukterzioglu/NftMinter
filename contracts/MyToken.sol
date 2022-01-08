// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor (uint256 initialSupply) ERC20("My Token", "MT") {
        _mint(msg.sender, initialSupply);
        console.log("Minted %s tokens to %s", initialSupply, msg.sender);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        console.log("Trying to send %s tokens to %s", amount, recipient);
        return super.transfer(recipient, amount);
    }
}