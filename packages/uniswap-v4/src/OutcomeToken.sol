// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OutcomeToken is ERC20 {
    address public immutable FACTORY;
    address public immutable MARKET;
    bool public immutable IS_YES_TOKEN;

    error OnlyFactory();
    error OnlyMarket();

    modifier onlyFactory() {
        _onlyFactory();
        _;
    }

    modifier onlyMarket() {
        _onlyMarket();
        _;
    }

    function _onlyFactory() internal view {
        if (msg.sender != FACTORY) revert OnlyFactory();
    }

    function _onlyMarket() internal view {
        if (msg.sender != MARKET) revert OnlyMarket();
    }

    constructor(
        string memory name,
        string memory symbol,
        address _market,
        bool _isYesToken
    ) ERC20(name, symbol) {
        FACTORY = msg.sender;
        MARKET = _market;
        IS_YES_TOKEN = _isYesToken;
    }

    function mint(address to, uint256 amount) external onlyMarket {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyMarket {
        _burn(from, amount);
    }
}
