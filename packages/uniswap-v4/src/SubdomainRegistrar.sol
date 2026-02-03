// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IENSRegistry {
    function setSubnodeRecord(
        bytes32 node,
        bytes32 label,
        address owner,
        address resolver,
        uint64 ttl
    ) external;
    function owner(bytes32 node) external view returns (address);
    function resolver(bytes32 node) external view returns (address);
}

interface INameWrapper {
    function setSubnodeOwner(
        bytes32 parentNode,
        string calldata label,
        address owner,
        uint32 fuses,
        uint64 expiry
    ) external returns (bytes32 node);

    function setSubnodeRecord(
        bytes32 parentNode,
        string calldata label,
        address owner,
        address resolver,
        uint64 ttl,
        uint32 fuses,
        uint64 expiry
    ) external returns (bytes32 node);

    function ownerOf(uint256 id) external view returns (address);
}

contract SubdomainRegistrar {
    bytes32 public immutable parentNode;
    INameWrapper public immutable nameWrapper;
    address public immutable resolver;

    mapping(bytes32 => bool) public subdomainClaimed;
    mapping(bytes32 => address) public subdomainOwner;

    event SubdomainClaimed(
        bytes32 indexed node,
        string label,
        address indexed owner
    );

    error SubdomainAlreadyClaimed();
    error EmptyLabel();

    constructor(bytes32 _parentNode, address _nameWrapper, address _resolver) {
        parentNode = _parentNode;
        nameWrapper = INameWrapper(_nameWrapper);
        resolver = _resolver;
    }

    function claimSubdomain(string calldata label) external returns (bytes32) {
        if (bytes(label).length == 0) revert EmptyLabel();

        bytes32 labelHash = keccak256(bytes(label));
        bytes32 node = keccak256(abi.encodePacked(parentNode, labelHash));

        if (subdomainClaimed[node]) revert SubdomainAlreadyClaimed();

        subdomainClaimed[node] = true;
        subdomainOwner[node] = msg.sender;

        nameWrapper.setSubnodeRecord(
            parentNode,
            label,
            msg.sender,
            resolver,
            0,
            0,
            type(uint64).max
        );

        emit SubdomainClaimed(node, label, msg.sender);

        return node;
    }

    function isSubdomainAvailable(
        string calldata label
    ) external view returns (bool) {
        bytes32 labelHash = keccak256(bytes(label));
        bytes32 node = keccak256(abi.encodePacked(parentNode, labelHash));
        return !subdomainClaimed[node];
    }

    function getSubdomainNode(
        string calldata label
    ) external view returns (bytes32) {
        bytes32 labelHash = keccak256(bytes(label));
        return keccak256(abi.encodePacked(parentNode, labelHash));
    }
}
