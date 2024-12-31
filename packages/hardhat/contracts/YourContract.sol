// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract PariContract {
    address public immutable owner;
    uint256 public pariIdCounter = 0;

    enum PariStatus { Open, Resolved, Cancelled }

    struct Pari {
        uint256 id;
        address creator;
        address taker;
        uint256 amount;
        string description;
        PariStatus status;
        address winner;
    }

    mapping(uint256 => Pari) public paris;

    event PariCreated(uint256 indexed pariId, address indexed creator, uint256 amount, string description);
    event PariTaken(uint256 indexed pariId, address indexed taker);
    event PariResolved(uint256 indexed pariId, address indexed winner);
    event PariCancelled(uint256 indexed pariId);

    modifier isOwner() {
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    modifier pariExists(uint256 pariId) {
        require(paris[pariId].id == pariId, "Pari does not exist");
        _;
    }

    modifier pariOpen(uint256 pariId) {
        require(paris[pariId].status == PariStatus.Open, "Pari is not open");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createPari(string memory description) public payable {
        require(msg.value > 0, "Bet amount must be greater than 0");

        paris[pariIdCounter] = Pari({
            id: pariIdCounter,
            creator: msg.sender,
            taker: address(0),
            amount: msg.value,
            description: description,
            status: PariStatus.Open,
            winner: address(0)
        });

        emit PariCreated(pariIdCounter, msg.sender, msg.value, description);

        pariIdCounter++;
    }

    function takePari(uint256 pariId) public payable pariExists(pariId) pariOpen(pariId) {
        Pari storage pari = paris[pariId];

        require(msg.value == pari.amount, "Bet amount must match");
        require(msg.sender != pari.creator, "Creator cannot take their own pari");

        pari.taker = msg.sender;
        pari.status = PariStatus.Resolved;

        emit PariTaken(pariId, msg.sender);
    }

    function resolvePari(uint256 pariId, address winner) public isOwner pariExists(pariId) {
        Pari storage pari = paris[pariId];

        require(pari.status == PariStatus.Resolved, "Pari is not resolved");
        require(winner == pari.creator || winner == pari.taker, "Invalid winner");

        pari.status = PariStatus.Resolved;
        pari.winner = winner;

        (bool success, ) = winner.call{ value: pari.amount * 2 }("");
        require(success, "Failed to send Ether to winner");

        emit PariResolved(pariId, winner);
    }

    function cancelPari(uint256 pariId) public pariExists(pariId) pariOpen(pariId) {
        Pari storage pari = paris[pariId];

        require(msg.sender == pari.creator, "Only creator can cancel pari");

        pari.status = PariStatus.Cancelled;

        (bool success, ) = pari.creator.call{ value: pari.amount }("");
        require(success, "Failed to refund creator");

        emit PariCancelled(pariId);
    }

    receive() external payable {}
}
