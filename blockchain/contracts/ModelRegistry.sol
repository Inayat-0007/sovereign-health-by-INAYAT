// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ModelRegistry
 * @dev Sovereign-Health: Immutable Federated Learning Contribution Ledger
 * 
 * This contract stores cryptographic hashes of each hospital node's
 * locally-trained model weights per round. It provides a tamper-proof
 * audit trail proving that contributions were made — without ever
 * storing or exposing raw patient data on-chain.
 */
contract ModelRegistry {

    struct Contribution {
        uint256 roundId;
        string hospitalId;
        string modelHash;      // SHA-256 hash of local model weights
        uint256 timestamp;
        uint256 localAccuracy;  // Scaled to basis points (e.g., 8500 = 85.00%)
    }

    // All contributions across all rounds
    Contribution[] public contributions;

    // Mapping: roundId => array of contribution indices
    mapping(uint256 => uint256[]) public roundContributions;

    // Owner of the contract (the Aggregator backend)
    address public owner;

    // Events for the Dashboard to listen to
    event ContributionLogged(
        uint256 indexed roundId,
        string hospitalId,
        string modelHash,
        uint256 timestamp,
        uint256 localAccuracy
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the aggregator can log contributions");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Log a single hospital's contribution for a given round.
     * Called by the Node.js Aggregator after receiving weights from a FedNode.
     */
    function logContribution(
        uint256 _roundId,
        string calldata _hospitalId,
        string calldata _modelHash,
        uint256 _localAccuracy
    ) external onlyOwner {
        Contribution memory c = Contribution({
            roundId: _roundId,
            hospitalId: _hospitalId,
            modelHash: _modelHash,
            timestamp: block.timestamp,
            localAccuracy: _localAccuracy
        });

        uint256 index = contributions.length;
        contributions.push(c);
        roundContributions[_roundId].push(index);

        emit ContributionLogged(
            _roundId,
            _hospitalId,
            _modelHash,
            block.timestamp,
            _localAccuracy
        );
    }

    /**
     * @dev Get all contribution indices for a specific round.
     */
    function getContributionsByRound(uint256 _roundId) external view returns (uint256[] memory) {
        return roundContributions[_roundId];
    }

    /**
     * @dev Get a single contribution by its global index.
     */
    function getContribution(uint256 _index) external view returns (
        uint256 roundId,
        string memory hospitalId,
        string memory modelHash,
        uint256 timestamp,
        uint256 localAccuracy
    ) {
        Contribution storage c = contributions[_index];
        return (c.roundId, c.hospitalId, c.modelHash, c.timestamp, c.localAccuracy);
    }

    /**
     * @dev Get total number of contributions logged.
     */
    function getTotalContributions() external view returns (uint256) {
        return contributions.length;
    }
}
