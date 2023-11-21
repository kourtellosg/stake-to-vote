// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DummyERC20 is ERC20 {
    constructor(uint256 supply) ERC20("Dummy Token", "DMT") {
        _mint(msg.sender, supply);
    }
}
