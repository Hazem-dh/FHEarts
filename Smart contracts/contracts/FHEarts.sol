// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FHE, externalEuint64, externalEuint8, euint8, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";

contract FHEarts is SepoliaConfig, Ownable {
    
    struct UserProfile {
        address userAddress;
        euint8 countryCode; // Country code for phone number
        euint8 leadingZero; // Leading zero indicator for phone number
        euint64 encryptedPhoneNumber; // Encrypted off-chain, revealed only on mutual match
        euint8 age; // Age in years
        euint8 location; // City/region code
        euint8 gender; // 0 for male, 1 for female, 2 for non-binary 3 for other
        euint8 interestedIn; // 0 for male, 1 for female, 2 for non-binary 3 for other 
        euint8 preference1; // First preference (0-9)
        euint8 preference2; // Second preference (0-9)
        euint8 preference3; // Third preference (0-9)
        bool isActive;
    }

    struct Match {
        euint8 score; // Encrypted match score
        euint64 matchIndex; // Encrypted index of matched user
        bool isValid; // Whether this match slot is used
    }

    struct MatchState {
        uint8 currentBatch; // Current batch being processed
        uint8 matchCount; // Number of matches found so far
        euint8 maxScore; // Current maximum score found
        euint64 maxScoreIndex; // Index of user with max score
        bool searchComplete; // Whether search is complete
    }

    // State variables 
    mapping(address => UserProfile) public profiles;
    mapping(address => bool) public isRegistered;
    
    uint64 public activeUsersCount;
    mapping(uint64 => address) public IndexToAddress;
    mapping(address => uint64) public userActiveIndex;
    
    // Matching system
    mapping(address => Match[5]) public userMatches; // Max 5 matches per user
    mapping(address => MatchState) public matchStates;
    
    // Consent and mutual matching
    mapping(address => mapping(address => bool)) public mutualMatches; // user1 => user2 => matched
    mapping(address => mapping(address => bool)) public phoneConsent; // user1 => user2 => consent given
    
    uint8 public constant BATCH_SIZE = 10;
    uint8 public constant MAX_PREFERENCE_VALUE = 9; // 0-9 for 10 preferences
    uint8 public constant MAX_MATCHES = 5;
    
    // Modifiers
    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }
    
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Registers a new user with encrypted profile details.
     */
    function registerUser(
        externalEuint8 countryCode,
        externalEuint8 leadingZero,
        externalEuint64 encryptedPhoneNumber,
        externalEuint8 age,
        externalEuint8 location,
        externalEuint8 gender,
        externalEuint8 interestedIn,
        externalEuint8 preference1,
        externalEuint8 preference2,
        externalEuint8 preference3,
        bytes calldata inputProof
    ) external {
        require(!isRegistered[msg.sender], "User already registered");

        // Convert external inputs to FHE types
        euint8 countryCode_ = FHE.fromExternal(countryCode, inputProof);
        euint8 leadingZero_ = FHE.fromExternal(leadingZero, inputProof);
        euint64 encryptedPhoneNumber_ = FHE.fromExternal(encryptedPhoneNumber, inputProof);
        euint8 age_ = FHE.fromExternal(age, inputProof);
        euint8 location_ = FHE.fromExternal(location, inputProof);
        euint8 gender_ = FHE.fromExternal(gender, inputProof);
        euint8 interestedIn_ = FHE.fromExternal(interestedIn, inputProof);
        euint8 preference1_ = FHE.fromExternal(preference1, inputProof);
        euint8 preference2_ = FHE.fromExternal(preference2, inputProof);
        euint8 preference3_ = FHE.fromExternal(preference3, inputProof);

        // Allow the contract to perform operations on these encrypted values
        FHE.allowThis(countryCode_);
        FHE.allowThis(leadingZero_);
        FHE.allowThis(encryptedPhoneNumber_);
        FHE.allowThis(age_);
        FHE.allowThis(location_);
        FHE.allowThis(gender_);
        FHE.allowThis(interestedIn_);
        FHE.allowThis(preference1_);
        FHE.allowThis(preference2_);
        FHE.allowThis(preference3_);
        FHE.allowThis(countryCode_);
        FHE.allow(leadingZero_,msg.sender);
        FHE.allow(encryptedPhoneNumber_,msg.sender);
        FHE.allow(age_,msg.sender);
        FHE.allow(location_,msg.sender);
        FHE.allow(gender_,msg.sender);
        FHE.allow(interestedIn_,msg.sender);
        FHE.allow(preference1_,msg.sender);
        FHE.allow(preference2_,msg.sender);
        FHE.allow(preference3_,msg.sender);

        // Create user profile
        profiles[msg.sender] = UserProfile({
            userAddress: msg.sender,
            countryCode: countryCode_,
            leadingZero: leadingZero_,
            encryptedPhoneNumber: encryptedPhoneNumber_,
            age: age_,
            location: location_,
            gender: gender_,
            interestedIn: interestedIn_,
            preference1: preference1_,
            preference2: preference2_,
            preference3: preference3_,
            isActive: true
        });

        // Add to active users
        activeUsersCount++;
        IndexToAddress[activeUsersCount] = msg.sender;
        userActiveIndex[msg.sender] = activeUsersCount;
        isRegistered[msg.sender] = true;
    }

    /**
     * @notice Search for matches in batches to handle scalability
     */
    function searchMatches() external onlyRegistered {
        MatchState storage state = matchStates[msg.sender];
        
        require(!state.searchComplete, "Search already complete");
        require(state.matchCount < MAX_MATCHES, "Maximum matches reached");
        
        UserProfile storage myProfile = profiles[msg.sender];
        uint64 startIndex = uint64(state.currentBatch) * BATCH_SIZE + 1;
        uint64 endIndex = startIndex + BATCH_SIZE - 1;
        
        // Don't exceed total user count
        if (endIndex > activeUsersCount) {
            endIndex = activeUsersCount;
        }
        
        // Initialize max score for this batch if it's the first iteration
        if (state.currentBatch == 0) {
            state.maxScore = FHE.asEuint8(0);
            state.maxScoreIndex = FHE.asEuint64(0);
            
            // Allow contract to manipulate these values
            FHE.allowThis(state.maxScore);
            FHE.allowThis(state.maxScoreIndex);
        }
        
        for (uint64 i = startIndex; i <= endIndex; i++) {
            address candidateAddr = IndexToAddress[i];
            
            // Skip self and inactive users
            if (candidateAddr == msg.sender || !profiles[candidateAddr].isActive) {
                continue;
            }
            
            UserProfile storage candidate = profiles[candidateAddr];
            
            // Check gender compatibility
            ebool genderMatch = FHE.eq(myProfile.interestedIn, candidate.gender);
            ebool reverseGenderMatch = FHE.eq(candidate.interestedIn, myProfile.gender);
            ebool bothGenderMatch = FHE.and(genderMatch, reverseGenderMatch);
            
            // Allow contract to work with these boolean values
            FHE.allowThis(genderMatch);
            FHE.allowThis(reverseGenderMatch);
            FHE.allowThis(bothGenderMatch);
            
            // Calculate preference score (each preference worth ~33 points, total 100)
            euint8 pref1Score = calculatePreferenceScore(myProfile.preference1, candidate.preference1);
            euint8 pref2Score = calculatePreferenceScore(myProfile.preference2, candidate.preference2);
            euint8 pref3Score = calculatePreferenceScore(myProfile.preference3, candidate.preference3);
            
            euint8 totalScore = FHE.add(FHE.add(pref1Score, pref2Score), pref3Score);
            FHE.allowThis(totalScore);
            
            // Only consider if gender matches
            euint8 finalScore = FHE.select(bothGenderMatch, totalScore, FHE.asEuint8(0));
            FHE.allowThis(finalScore);
            
            // Update max score if this is better
            ebool isBetterScore = FHE.gt(finalScore, state.maxScore);
            FHE.allowThis(isBetterScore);
            
            euint8 newMaxScore = FHE.select(isBetterScore, finalScore, state.maxScore);
            euint64 newMaxScoreIndex = FHE.select(isBetterScore, FHE.asEuint64(i), state.maxScoreIndex);
            
            FHE.allowThis(newMaxScore);
            FHE.allowThis(newMaxScoreIndex);
            
            state.maxScore = newMaxScore;
            state.maxScoreIndex = newMaxScoreIndex;
        }
        
        state.currentBatch++;
        
        // Check if search is complete
        if (endIndex >= activeUsersCount) {
            state.searchComplete = true;
            
            // Store the best match found
            userMatches[msg.sender][state.matchCount] = Match({
                score: state.maxScore,
                matchIndex: state.maxScoreIndex,
                isValid: true
            });
            state.matchCount++;
            
            // Allow user to decrypt this match
            FHE.allow(state.maxScore, msg.sender);
            FHE.allow(state.maxScoreIndex, msg.sender);
        }
    }
    
    /**
     * @notice Calculate preference compatibility score
     */
    function calculatePreferenceScore(euint8 myPref, euint8 theirPref) internal returns (euint8) {
        ebool exactMatch = FHE.eq(myPref, theirPref);
        FHE.allowThis(exactMatch);
        
        euint8 score = FHE.select(exactMatch, FHE.asEuint8(33), FHE.asEuint8(0));
        FHE.allowThis(score);
        
        // Exact match = 33 points, no match = 0 points
        return score;
    }
    
    /**
     * @notice Confirm a match (first step of mutual matching)
     */
    function confirmMatch(uint64 matchedUserIndex) external onlyRegistered {
        address matchedUser = IndexToAddress[matchedUserIndex];
        require(matchedUser != address(0), "Invalid matched user");
        require(isRegistered[matchedUser], "Matched user not registered");
        
        // Set mutual match from this user's side
        mutualMatches[msg.sender][matchedUser] = true;
    }
    
    /**
     * @notice Give consent to share phone number with matched user
     */
    function givePhoneConsent(address matchedUser) external onlyRegistered {
        require(isRegistered[matchedUser], "Matched user not registered");
        require(mutualMatches[msg.sender][matchedUser], "No confirmed match with this user");
        
        phoneConsent[msg.sender][matchedUser] = true;
        
        // If both users have given consent, allow decryption
        if (phoneConsent[matchedUser][msg.sender]) {
            // Allow both users to decrypt each other's phone information
            FHE.allow(profiles[msg.sender].countryCode, matchedUser);
            FHE.allow(profiles[msg.sender].leadingZero, matchedUser);
            FHE.allow(profiles[msg.sender].encryptedPhoneNumber, matchedUser);
            
            FHE.allow(profiles[matchedUser].countryCode, msg.sender);
            FHE.allow(profiles[matchedUser].leadingZero, msg.sender);
            FHE.allow(profiles[matchedUser].encryptedPhoneNumber, msg.sender);
        }
    }
    
    /**
     * @notice Respond to a match request (when someone matched with you)
     */
    function respondToMatch(address requester, bool accept) external onlyRegistered {
        require(isRegistered[requester], "Requester not registered");
        require(mutualMatches[requester][msg.sender], "No match request from this user");
        
        if (accept) {
            mutualMatches[msg.sender][requester] = true;
        }
    }
    
    /**
     * @notice Update user profile and reset all matches
     */
    function updateProfile(
        externalEuint8 countryCode,
        externalEuint8 leadingZero,
        externalEuint64 encryptedPhoneNumber,
        externalEuint8 age,
        externalEuint8 location,
        externalEuint8 gender,
        externalEuint8 interestedIn,
        externalEuint8 preference1,
        externalEuint8 preference2,
        externalEuint8 preference3,
        bytes calldata inputProof
    ) external onlyRegistered {
        // Convert external inputs to FHE types
        euint8 countryCode_ = FHE.fromExternal(countryCode, inputProof);
        euint8 leadingZero_ = FHE.fromExternal(leadingZero, inputProof);
        euint64 encryptedPhoneNumber_ = FHE.fromExternal(encryptedPhoneNumber, inputProof);
        euint8 age_ = FHE.fromExternal(age, inputProof);
        euint8 location_ = FHE.fromExternal(location, inputProof);
        euint8 gender_ = FHE.fromExternal(gender, inputProof);
        euint8 interestedIn_ = FHE.fromExternal(interestedIn, inputProof);
        euint8 preference1_ = FHE.fromExternal(preference1, inputProof);
        euint8 preference2_ = FHE.fromExternal(preference2, inputProof);
        euint8 preference3_ = FHE.fromExternal(preference3, inputProof);

        // Allow the contract to perform operations on these encrypted values
        FHE.allowThis(countryCode_);
        FHE.allowThis(leadingZero_);
        FHE.allowThis(encryptedPhoneNumber_);
        FHE.allowThis(age_);
        FHE.allowThis(location_);
        FHE.allowThis(gender_);
        FHE.allowThis(interestedIn_);
        FHE.allowThis(preference1_);
        FHE.allowThis(preference2_);
        FHE.allowThis(preference3_);

        // Update user profile
        UserProfile storage profile = profiles[msg.sender];
        profile.countryCode = countryCode_;
        profile.leadingZero = leadingZero_;
        profile.encryptedPhoneNumber = encryptedPhoneNumber_;
        profile.age = age_;
        profile.location = location_;
        profile.gender = gender_;
        profile.interestedIn = interestedIn_;
        profile.preference1 = preference1_;
        profile.preference2 = preference2_;
        profile.preference3 = preference3_;
        profile.isActive = true; // Reactivate profile if it was deactivated

        // Reset match state
        MatchState storage state = matchStates[msg.sender];
        state.currentBatch = 0;
        state.matchCount = 0;
        
        // Create new encrypted zeros with allowThis
        euint8 zeroScore = FHE.asEuint8(0);
        euint64 zeroIndex = FHE.asEuint64(0);
        FHE.allowThis(zeroScore);
        FHE.allowThis(zeroIndex);
        
        state.maxScore = zeroScore;
        state.maxScoreIndex = zeroIndex;
        state.searchComplete = false;

        // Clear existing matches
        for (uint8 i = 0; i < MAX_MATCHES; i++) {
            userMatches[msg.sender][i].isValid = false;
        }

        // Clear all mutual matches and consent involving this user
        for (uint64 i = 1; i <= activeUsersCount; i++) {
            address otherUser = IndexToAddress[i];
            if (otherUser != address(0) && otherUser != msg.sender) {
                // Clear mutual matches in both directions
                mutualMatches[msg.sender][otherUser] = false;
                mutualMatches[otherUser][msg.sender] = false;
                
                // Clear phone consent in both directions
                phoneConsent[msg.sender][otherUser] = false;
                phoneConsent[otherUser][msg.sender] = false;
            }
        }
    }

    /**
     * @notice Reset user's match search to start over
     */
    function resetMatchSearch() external onlyRegistered {
        MatchState storage state = matchStates[msg.sender];
        state.currentBatch = 0;
        state.matchCount = 0;
        
        // Create new encrypted zeros with allowThis
        euint8 zeroScore = FHE.asEuint8(0);
        euint64 zeroIndex = FHE.asEuint64(0);
        FHE.allowThis(zeroScore);
        FHE.allowThis(zeroIndex);
        
        state.maxScore = zeroScore;
        state.maxScoreIndex = zeroIndex;
        state.searchComplete = false;
        
        // Clear existing matches
        for (uint8 i = 0; i < MAX_MATCHES; i++) {
            userMatches[msg.sender][i].isValid = false;
        }
    }
    
    /**
     * @notice Check if two users have mutual consent for phone sharing
     */
    function hasMutualPhoneConsent(address user1, address user2) external view returns (bool) {
        return phoneConsent[user1][user2] && phoneConsent[user2][user1];
    }
    
    /**
     * @notice Check if user has any pending match requests
     */
    function hasPendingMatches(address user) external view returns (address[] memory) {
        address[] memory pending = new address[](activeUsersCount);
        uint256 count = 0;
        
        for (uint64 i = 1; i <= activeUsersCount; i++) {
            address candidate = IndexToAddress[i];
            if (mutualMatches[candidate][user] && !mutualMatches[user][candidate]) {
                pending[count] = candidate;
                count++;
            }
        }
        
        // Resize array to actual count
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pending[i];
        }
        
        return result;
    }
    
    /**
 * @notice Get user's own encrypted profile data for frontend decryption
 * @return userAddress The address of the user
 * @return countryCode Encrypted country code
 * @return leadingZero Encrypted leading zero indicator
 * @return encryptedPhoneNumber Encrypted phone number
 * @return age Encrypted age
 * @return location Encrypted location
 * @return gender Encrypted gender
 * @return interestedIn Encrypted interest preference
 * @return preference1 Encrypted preference 1
 * @return preference2 Encrypted preference 2
 * @return preference3 Encrypted preference 3
 * @return isActive Whether the profile is active
 */
function getMyProfile() external view onlyRegistered returns (
    address userAddress,
    euint8 countryCode,
    euint8 leadingZero,
    euint64 encryptedPhoneNumber,
    euint8 age,
    euint8 location,
    euint8 gender,
    euint8 interestedIn,
    euint8 preference1,
    euint8 preference2,
    euint8 preference3,
    bool isActive
) {
    UserProfile storage profile = profiles[msg.sender];
    
    return (
        profile.userAddress,
        profile.countryCode,
        profile.leadingZero,
        profile.encryptedPhoneNumber,
        profile.age,
        profile.location,
        profile.gender,
        profile.interestedIn,
        profile.preference1,
        profile.preference2,
        profile.preference3,
        profile.isActive
    );
}

/**
 * @notice Check if a specific user is registered
 * @param user The address to check
 * @return registered Whether the user is registered
 */
function isUserRegistered(address user) external view returns (bool) {
    return isRegistered[user];
}
    /**
     * @notice Get user's match count and search status
     */
    function getMatchStatus(address user) external view returns (uint8 matchCount, uint8 currentBatch, bool searchComplete) {
        MatchState storage state = matchStates[user];
        return (state.matchCount, state.currentBatch, state.searchComplete);
    }
    
    /**
     * @notice Deactivate user profile
     */
    function deactivateProfile() external onlyRegistered {
        profiles[msg.sender].isActive = false;
    }
    
    /**
     * @notice Reactivate user profile
     */
    function reactivateProfile() external onlyRegistered {
        profiles[msg.sender].isActive = true;
    }
}