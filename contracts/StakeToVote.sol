// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract StakeToVote is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    struct Survey {
        uint256 inFavour;
        uint256 totalVotes;
        uint256 createdAt;
        string description;
        mapping(address => bool) voted;
    }

    error InvalidStakeToken();
    error StakeAmountLessThanMin();
    error NotEnoughStake();
    error NotEnoughStakeToVote();
    error AlreadyVoted(address account);

    event StakeUpdated(address indexed account, uint256 amount);
    event SurveyAdded(uint256 indexed surveyIndex, string description);
    event VotedForSurvey(
        uint256 indexed surveyIndex,
        address indexed voter,
        bool inFavour
    );

    ERC20 public stakeToken;
    uint256 public surveyCounter;
    uint256 public minStakeAmount;

    mapping(address => uint256) public accountStake;
    mapping(uint256 => Survey) public surveys;

    modifier hasStake(address _account, uint256 _amount) {
        if (accountStake[_account] < _amount) revert NotEnoughStake();
        _;
    }

    modifier canVote(address _account) {
        if (accountStake[_account] < minStakeAmount)
            revert NotEnoughStakeToVote();
        _;
    }

    function initialize(
        address _stakeToken,
        uint256 _minStakeAmount
    ) public virtual initializer {
        if (_stakeToken == address(0)) revert InvalidStakeToken();
        stakeToken = ERC20(_stakeToken);
        minStakeAmount = _minStakeAmount;
        surveyCounter = 1;
        __Ownable_init(msg.sender);
    }

    function _authorizeUpgrade(
        address _newImplementation
    ) internal view override onlyOwner {}

    function addSurvey(string memory _description) public onlyOwner {
        // surveys[surveyCounter] = Survey(0, 0, block.timestamp, _description);
        surveys[surveyCounter].description = _description;
        surveys[surveyCounter].inFavour = 0;
        surveys[surveyCounter].totalVotes = 0;
        surveys[surveyCounter].createdAt = block.timestamp;
        surveyCounter++;
        emit SurveyAdded(surveyCounter - 1, _description);
    }

    function stake(uint256 _stakeAmount) public {
        if (_stakeAmount < minStakeAmount) revert StakeAmountLessThanMin();
        accountStake[msg.sender] += _stakeAmount;
        stakeToken.transferFrom(msg.sender, address(this), _stakeAmount);
        emit StakeUpdated(msg.sender, accountStake[msg.sender]);
    }

    function unstake(
        uint256 _unstakeAmount
    ) public hasStake(msg.sender, _unstakeAmount) {
        accountStake[msg.sender] -= _unstakeAmount;
        stakeToken.transfer(msg.sender, _unstakeAmount);
        emit StakeUpdated(msg.sender, accountStake[msg.sender]);
    }

    function vote(
        uint256 _surveyIndex,
        bool _inFavour
    ) public canVote(msg.sender) {
        Survey storage survey = surveys[_surveyIndex];
        if (survey.voted[msg.sender]) revert AlreadyVoted(msg.sender);
        survey.totalVotes++;
        if (_inFavour) {
            survey.inFavour++;
        }
        survey.voted[msg.sender] = true;

        emit VotedForSurvey(_surveyIndex, msg.sender, _inFavour);
    }
}
