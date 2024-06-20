// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DAI is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("DAI", "DAI")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 1000000000000 * 10 ** decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 15;
    }
}