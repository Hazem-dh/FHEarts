// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;


import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {FHE, externalEuint64,externalEuint8, euint8 ,euint64} from "@fhevm/solidity/lib/FHE.sol";

contract FHEarts is SepoliaConfig,Ownable {
    

    struct UserProfile {
        address userAddress;
        euint8 countryCode; // Country code for phone number
        euint8 leadingZero; // Leading zero indicator for phone number
        euint64 encryptedPhoneNumber; // Encrypted off-chain, revealed only on mutual match
        euint8 age; // Age in years
        euint8 location; // City/region code
        euint8 gender ; // 0 for  male, 1 for female, 2 for non-binary 3 for other
        euint8 intersetedIn; // 0 for  male, 1 for  female, 2 for non-binary 3 for other 
        euint8 preference1; // First preference (0-9)
        euint8 preference2; // Second preference (0-9)
        euint8 preference3; // Third preference (0-9)
        bool isActive;
    }


    // State variables 

    
    mapping(address => UserProfile) public profiles;
    mapping(address => bool) public isRegistered;

    
    uint64 activeUsersCount;
    mapping(uint64 => address) public IndexToAddress;
    mapping(address => uint256) public userActiveIndex;
    
    uint256 public constant MATCH_THRESHOLD = 70; // Minimum score for a match (out of 100)
    uint256 public constant BATCH_SIZE = 10;
    uint256 public constant MAX_PREFERENCE_VALUE = 9; // 0-9 for 10 preferences
    
    // Events
    event UserRegistered(address indexed user);


    // Modifiers
    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }

    
    constructor()Ownable(msg.sender) {}

        /**
    * @notice Registers a new user with encrypted profile details.
    * @dev Accepts encrypted inputs using FHE and stores them in the user's profile.
    *      Each input is verified using the provided zero-knowledge proof.
    * @param encryptedPhoneNumber Encrypted phone number (FHE externalEuint8).
    * @param age Encrypted age (FHE externalEuint8).
    * @param location Encrypted location code (FHE externalEuint8).
    * @param preference1 Encrypted first preference (FHE externalEuint8, 0-9).
    * @param preference2 Encrypted second preference (FHE externalEuint8, 0-9).
    * @param preference3 Encrypted third preference (FHE externalEuint8, 0-9).
    * @param inputProof Zero-knowledge proof for encrypted inputs.
        */
        
    function registerUser(
        externalEuint8 countryCode,
        externalEuint8 leadingZero,
        externalEuint64 encryptedPhoneNumber,
        externalEuint8 age  ,
        externalEuint8 location ,
        externalEuint8 gender ,
        externalEuint8 intersetedIn ,
        externalEuint8 preference1 ,
        externalEuint8 preference2 ,
        externalEuint8 preference3 ,
        bytes calldata inputProof
    ) external {
        require(!isRegistered[msg.sender], "User already registered");

        // Convert external inputs to FHE types using the correct method
        euint8 countryCode_ = FHE.fromExternal(countryCode, inputProof);
        euint8 leadingZero_ = FHE.fromExternal(leadingZero, inputProof);
        euint64 encryptedPhoneNumber_ = FHE.fromExternal(encryptedPhoneNumber, inputProof);
        euint8 age_ = FHE.fromExternal(age,inputProof );
        euint8 location_ = FHE.fromExternal(location,inputProof );
        euint8 gender_ = FHE.fromExternal(gender,inputProof );
        euint8 intersetedIn_ = FHE.fromExternal(intersetedIn,inputProof );
        euint8 preference1_ = FHE.fromExternal(preference1,inputProof );
        euint8 preference2_ = FHE.fromExternal(preference2,inputProof );
        euint8 preference3_ = FHE.fromExternal(preference3,inputProof );

        // Create user profile
        profiles[msg.sender] = UserProfile({
            userAddress: msg.sender,
            countryCode: countryCode_,
            leadingZero: leadingZero_,
            encryptedPhoneNumber: encryptedPhoneNumber_,
            age: age_,
            location: location_,
            gender : gender_,
            intersetedIn: intersetedIn_,
            preference1: preference1_,
            preference2: preference2_,
            preference3: preference3_,
            isActive: true
        });

        // Add to active users
        activeUsersCount++;
        userActiveIndex[msg.sender] = activeUsersCount;
        isRegistered[msg.sender] = true;

        emit UserRegistered(msg.sender);
    }

}