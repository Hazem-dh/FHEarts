// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, externalEuint64, externalEuint8, euint8, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title FHEarts - Privacy-Preserving Dating Platform
 * @author Hazem-dh
 * @notice A decentralized dating platform using Fully Homomorphic Encryption (FHE) to protect user privacy
 * @dev Built on Zama's fhEVM for encrypted computations on user data
 * @custom:security Uses FHE to ensure user data remains encrypted even during matching computations
 */
contract FHEarts is SepoliaConfig {
    
    /**
     * @notice User profile structure containing all encrypted personal information
     * @dev All sensitive data fields use FHE encryption types (euint8, euint64)
     * @param userAddress Public wallet address of the user
     * @param countryCode Encrypted country code for phone number
     * @param leadingZero Encrypted leading zero indicator for phone number formatting
     * @param encryptedPhoneNumber Encrypted phone number, revealed only on mutual match
     * @param age Encrypted age in years
     * @param location Encrypted city/region code for geographical matching
     * @param gender Encrypted gender identity (0=male, 1=female, 2=non-binary, 3=other)
     * @param interestedIn Encrypted gender preference (0=male, 1=female, 2=non-binary, 3=other)
     * @param preference1 Encrypted first interest/hobby preference (0-9)
     * @param preference2 Encrypted second interest/hobby preference (0-9)
     * @param preference3 Encrypted third interest/hobby preference (0-9)
     * @param isActive Public flag indicating if profile is active for matching
     */
    struct UserProfile {
        address userAddress;
        euint8 countryCode;
        euint8 leadingZero;
        euint64 encryptedPhoneNumber;
        euint8 age;
        euint8 location;
        euint8 gender;
        euint8 interestedIn;
        euint8 preference1;
        euint8 preference2;
        euint8 preference3;
        bool isActive;
    }

    /**
     * @notice Match result structure containing encrypted match information
     * @dev Stores the best match found for a user with encrypted score and index
     * @param score Encrypted compatibility score (0-99, higher is better)
     * @param matchIndex Encrypted index of matched user in the activeUsers mapping
     * @param isValid Public flag indicating if this match slot contains valid data
     */
    struct Match {
        euint8 score;
        euint64 matchIndex;
        bool isValid;
    }

    /// @notice Mapping from user address to their encrypted profile data
    /// @dev Contains all user profile information in encrypted form
    mapping(address => UserProfile) public profiles;
    
    /// @notice Mapping to track which addresses have registered profiles
    /// @dev Used for access control and validation
    mapping(address => bool) public isRegistered;
    
    /// @notice Total count of active users in the system
    /// @dev Used for iteration bounds during matching algorithm
    uint64 public activeUsersCount;
    
    /// @notice Mapping from sequential index to user address for efficient iteration
    /// @dev Enables O(n) traversal of all users during matching, index starts from 1
    mapping(uint64 => address) public IndexToAddress;
    
    /// @notice Reverse mapping from user address to their sequential index
    /// @dev Allows quick lookup of user's position in the iteration sequence
    mapping(address => uint64) public userActiveIndex;
    
    /// @notice Mapping storing each user's best match result from latest search
    /// @dev Contains encrypted match score and target user index
    mapping(address => Match) public userBestMatch;
    
    /// @notice Two-dimensional mapping tracking mutual match confirmations
    /// @dev mutualMatches[user1][user2] = true means user1 confirmed interest in user2
    /// @custom:privacy Only stores boolean confirmations, no sensitive match data
    mapping(address => mapping(address => bool)) public mutualMatches;
    
    /// @notice Two-dimensional mapping tracking phone number sharing consent
    /// @dev phoneConsent[user1][user2] = true means user1 consents to share phone with user2
    /// @custom:privacy Enables controlled revelation of phone data only after mutual consent
    mapping(address => mapping(address => bool)) public phoneConsent;
    

    
    /**
     * @notice Modifier to restrict function access to registered users only
     * @dev Prevents unregistered addresses from calling protected functions
     * @custom:throws "User not registered" if caller hasn't completed registration
     */
    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }
    
    /**
     * @notice Contract constructor
     * @custom:inheritance No ownership or admin roles, fully decentralized
     * @custom:security All users have equal permissions, no privileged roles
     */
    constructor()  {}

    /**
     * @notice Registers a new user with encrypted profile details
     * @dev Converts external FHE inputs to internal types and sets up encryption permissions
     * @param countryCode External encrypted country code for phone number (e.g., 1 for US, 44 for UK)
     * @param leadingZero External encrypted leading zero indicator for phone formatting
     * @param encryptedPhoneNumber External encrypted complete phone number
     * @param age External encrypted age in years
     * @param location External encrypted city/region identifier code
     * @param gender External encrypted gender identity (0=male, 1=female, 2=non-binary, 3=other)
     * @param interestedIn External encrypted gender preference for matching (0=male, 1=female, 2=non-binary, 3=other)
     * @param preference1 External encrypted first interest/hobby preference (0-9 range)
     * @param preference2 External encrypted second interest/hobby preference (0-9 range)
     * @param preference3 External encrypted third interest/hobby preference (0-9 range)
     * @param inputProof Cryptographic proof validating the encrypted input parameters
     * @custom:throws "User already registered" if the calling address already has a profile
     * @custom:security All inputs remain encrypted throughout the registration process
     * @custom:permissions Sets up FHE permissions allowing contract operations and user decryption
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

        // Convert external FHE inputs to internal encrypted types
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

        // Grant contract permission to perform encrypted operations on user data
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
        
        // Grant user permission to decrypt their own profile data
        FHE.allow(countryCode_,msg.sender);
        FHE.allow(leadingZero_,msg.sender);
        FHE.allow(encryptedPhoneNumber_,msg.sender);
        FHE.allow(age_,msg.sender);
        FHE.allow(location_,msg.sender);
        FHE.allow(gender_,msg.sender);
        FHE.allow(interestedIn_,msg.sender);
        FHE.allow(preference1_,msg.sender);
        FHE.allow(preference2_,msg.sender);
        FHE.allow(preference3_,msg.sender);

        // Create and store encrypted user profile
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

        // Add user to active users tracking system
        activeUsersCount++;
        IndexToAddress[activeUsersCount] = msg.sender;
        userActiveIndex[msg.sender] = activeUsersCount;
        isRegistered[msg.sender] = true;
    }

    /**
     * @notice Searches for the best compatibility match among all registered users
     * @dev Performs fully encrypted matching algorithm without revealing any user data
     * @custom:algorithm Iterates through all active users, calculates encrypted compatibility scores, selects maximum
     * @custom:scoring Each matching preference contributes 33 points, maximum possible score is 99
     * @custom:compatibility Requires bidirectional gender interest compatibility
     * @custom:privacy All comparisons and scoring happen in encrypted space
     * @custom:complexity O(n) where n is the number of active users
     * @custom:throws "Not enough users for matching" if fewer than 2 users are active
     * @custom:gas High gas usage due to encrypted operations in loops
     */
    function searchMatches() external onlyRegistered {
        require(activeUsersCount > 1, "Not enough users for matching");
        
        UserProfile storage myProfile = profiles[msg.sender];
        
        // Initialize encrypted variables for tracking best match
        euint8 maxScore = FHE.asEuint8(0);
        euint64 maxScoreIndex = FHE.asEuint64(0);
        FHE.allowThis(maxScore);
        FHE.allowThis(maxScoreIndex);
        
        // Iterate through all active users for compatibility evaluation
        for (uint64 i = 1; i <= activeUsersCount; i++) {
            address candidateAddr = IndexToAddress[i];
            
            // Skip self-matching and inactive profiles
            if (candidateAddr == msg.sender || !profiles[candidateAddr].isActive) {
                continue;
            }
            
            UserProfile storage candidate = profiles[candidateAddr];
            
            // Evaluate mutual gender compatibility in encrypted space
            ebool genderMatch = FHE.eq(myProfile.interestedIn, candidate.gender);
            ebool reverseGenderMatch = FHE.eq(candidate.interestedIn, myProfile.gender);
            ebool bothGenderMatch = FHE.and(genderMatch, reverseGenderMatch);
            
            FHE.allowThis(genderMatch);
            FHE.allowThis(reverseGenderMatch);
            FHE.allowThis(bothGenderMatch);
            
            // Calculate encrypted preference compatibility scores
            euint8 pref1Score = calculatePreferenceScore(myProfile.preference1, candidate.preference1);
            euint8 pref2Score = calculatePreferenceScore(myProfile.preference2, candidate.preference2);
            euint8 pref3Score = calculatePreferenceScore(myProfile.preference3, candidate.preference3);
            
            euint8 totalScore = FHE.add(FHE.add(pref1Score, pref2Score), pref3Score);
            FHE.allowThis(totalScore);
            
            // Apply gender compatibility filter (score = 0 if genders don't match)
            euint8 finalScore = FHE.select(bothGenderMatch, totalScore, FHE.asEuint8(0));
            FHE.allowThis(finalScore);
            
            // Update maximum score if current candidate is better
            ebool isBetterScore = FHE.gt(finalScore, maxScore);
            FHE.allowThis(isBetterScore);
            
            euint8 newMaxScore = FHE.select(isBetterScore, finalScore, maxScore);
            euint64 newMaxScoreIndex = FHE.select(isBetterScore, FHE.asEuint64(i), maxScoreIndex);
            
            FHE.allowThis(newMaxScore);
            FHE.allowThis(newMaxScoreIndex);
            
            maxScore = newMaxScore;
            maxScoreIndex = newMaxScoreIndex;
        }
        
        // Store the best match result for the user
        userBestMatch[msg.sender] = Match({
            score: maxScore,
            matchIndex: maxScoreIndex,
            isValid: true
        });
        
        // Grant user permission to decrypt their match results
        FHE.allow(maxScore, msg.sender);
        FHE.allow(maxScoreIndex, msg.sender);
    }
    
    /**
     * @notice Calculates compatibility score between two encrypted preference values
     * @dev Internal function performing encrypted comparison and scoring
     * @param myPref Encrypted preference value of the current user
     * @param theirPref Encrypted preference value of the candidate user
     * @return score Encrypted compatibility score (33 for exact match, 0 for no match)
     * @custom:scoring Uses binary scoring: full points for exact match, zero otherwise
     * @custom:privacy Comparison happens entirely in encrypted space
     */
    function calculatePreferenceScore(euint8 myPref, euint8 theirPref) internal returns (euint8) {
        ebool exactMatch = FHE.eq(myPref, theirPref);
        FHE.allowThis(exactMatch);
        
        euint8 score = FHE.select(exactMatch, FHE.asEuint8(33), FHE.asEuint8(0));
        FHE.allowThis(score);
        
        return score;
    }
    
    /**
     * @notice Confirms interest in a matched user (initiates mutual matching process)
     * @dev First step of two-step mutual matching process
     * @param matchedUserIndex Sequential index of the user to confirm match with
     * @custom:throws "Invalid matched user" if index doesn't map to valid address
     * @custom:throws "Matched user not registered" if target user is not registered
     * @custom:flow After confirmation, target user can accept/reject via respondToMatch()
     * @custom:privacy Only stores boolean confirmation, no sensitive match details
     */
    function confirmMatch(uint64 matchedUserIndex) external onlyRegistered {
        address matchedUser = IndexToAddress[matchedUserIndex];
        require(matchedUser != address(0), "Invalid matched user");
        require(isRegistered[matchedUser], "Matched user not registered");
        
        // Record match confirmation from current user's side
        mutualMatches[msg.sender][matchedUser] = true;
    }
    
    /**
     * @notice Grants consent to share encrypted phone number with a mutually matched user
     * @dev Enables controlled revelation of sensitive contact information
     * @param matchedUser Address of the mutually matched user to share phone data with
     * @custom:throws "Matched user not registered" if target user is not registered
     * @custom:throws "No confirmed match with this user" if no mutual match exists
     * @custom:permissions Automatically grants FHE decryption rights when mutual consent achieved
     * @custom:privacy Phone data only becomes accessible after both users give explicit consent
     */
    function givePhoneConsent(address matchedUser) external onlyRegistered {
        require(isRegistered[matchedUser], "Matched user not registered");
        require(mutualMatches[msg.sender][matchedUser], "No confirmed match with this user");
        
        phoneConsent[msg.sender][matchedUser] = true;
        
        // Enable mutual phone data decryption if both users have given consent
        if (phoneConsent[matchedUser][msg.sender]) {
            // Grant bidirectional access to encrypted phone information
            FHE.allow(profiles[msg.sender].countryCode, matchedUser);
            FHE.allow(profiles[msg.sender].leadingZero, matchedUser);
            FHE.allow(profiles[msg.sender].encryptedPhoneNumber, matchedUser);
            
            FHE.allow(profiles[matchedUser].countryCode, msg.sender);
            FHE.allow(profiles[matchedUser].leadingZero, msg.sender);
            FHE.allow(profiles[matchedUser].encryptedPhoneNumber, msg.sender);
        }
    }
    
    /**
     * @notice Responds to a received match request with acceptance or rejection
     * @dev Second step of mutual matching process, handles both positive and negative responses
     * @param requester Address of the user who sent the original match request
     * @param accept Boolean indicating whether to accept (true) or reject (false) the match
     * @custom:throws "Requester not registered" if the requesting user is not registered
     * @custom:throws "No match request from this user" if no pending request exists
     * @custom:cleanup On rejection, clears match request and any associated phone consent
     * @custom:privacy Rejection handling prevents persistent unwanted match requests
     */
    function respondToMatch(address requester, bool accept) external onlyRegistered {
        require(isRegistered[requester], "Requester not registered");
        require(mutualMatches[requester][msg.sender], "No match request from this user");
        
        if (accept) {
            // Accept the match - establish mutual confirmation
            mutualMatches[msg.sender][requester] = true;
        } else {
            // Reject the match - clean up all related state
            mutualMatches[requester][msg.sender] = false;
            
            // Clear any existing phone consent to ensure clean state
            phoneConsent[requester][msg.sender] = false;
            phoneConsent[msg.sender][requester] = false;
        }
    }
    
    /**
     * @notice Updates user profile with new encrypted data and resets matching state
     * @dev Comprehensive profile update that clears all existing matches and relationships
     * @param countryCode New external encrypted country code
     * @param leadingZero New external encrypted leading zero indicator
     * @param encryptedPhoneNumber New external encrypted phone number
     * @param age New external encrypted age
     * @param location New external encrypted location code
     * @param gender New external encrypted gender identity
     * @param interestedIn New external encrypted gender preference
     * @param preference1 New external encrypted first preference
     * @param preference2 New external encrypted second preference
     * @param preference3 New external encrypted third preference
     * @param inputProof Cryptographic proof for new encrypted inputs
     * @custom:reset Clears all existing matches, mutual confirmations, and phone consents
     * @custom:reactivation Automatically reactivates profile if it was previously deactivated
     * @custom:permissions Reestablishes FHE permissions for new encrypted data
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
        // Convert all external inputs to internal FHE types
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

        // Establish FHE permissions for contract operations
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
        
        // Establish FHE permissions for user decryption
        FHE.allow(countryCode_,msg.sender);
        FHE.allow(leadingZero_,msg.sender);
        FHE.allow(encryptedPhoneNumber_,msg.sender);
        FHE.allow(age_,msg.sender);
        FHE.allow(location_,msg.sender);
        FHE.allow(gender_,msg.sender);
        FHE.allow(interestedIn_,msg.sender);
        FHE.allow(preference1_,msg.sender);
        FHE.allow(preference2_,msg.sender);
        FHE.allow(preference3_,msg.sender);

        // Update all profile fields with new encrypted values
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
        profile.isActive = true;

        // Clear existing match to force fresh search
        userBestMatch[msg.sender].isValid = false;

        // Clear all mutual matches and consent involving this user
        for (uint64 i = 1; i <= activeUsersCount; i++) {
            address otherUser = IndexToAddress[i];
            if (otherUser != address(0) && otherUser != msg.sender) {
                // Clear bidirectional mutual match confirmations
                mutualMatches[msg.sender][otherUser] = false;
                mutualMatches[otherUser][msg.sender] = false;
                
                // Clear bidirectional phone sharing consent
                phoneConsent[msg.sender][otherUser] = false;
                phoneConsent[otherUser][msg.sender] = false;
            }
        }
    }

    /**
     * @notice Clears user's current best match to enable fresh search
     * @dev Simple function to reset match state without affecting profile data
     * @custom:usage Allows users to search for new matches after rejecting current results
     * @custom:lightweight Does not affect profile data or mutual match confirmations
     */
    function clearMatch() external onlyRegistered {
        userBestMatch[msg.sender].isValid = false;
    }
    
    /**
     * @notice Checks if two users have mutual consent for phone number sharing
     * @dev View function to verify bidirectional consent status
     * @param user1 First user address to check
     * @param user2 Second user address to check  
     * @return bool True if both users have given consent to share phone data with each other
     * @custom:privacy Only reveals boolean consent status, not the actual phone data
     */
    function hasMutualPhoneConsent(address user1, address user2) external view returns (bool) {
        return phoneConsent[user1][user2] && phoneConsent[user2][user1];
    }
    
    /**
     * @notice Retrieves list of users who have sent match requests to specified user
     * @dev Identifies pending match requests that await response
     * @param user Address to check for pending incoming match requests
     * @return Array of addresses representing users who sent unresponded match requests
     * @custom:algorithm Iterates through all users to find asymmetric match confirmations
     * @custom:complexity O(n) where n is the number of active users
     * @custom:usage Enables users to see and respond to incoming match requests
     */
    function hasPendingMatches(address user) external view returns (address[] memory) {
        address[] memory pending = new address[](activeUsersCount);
        uint256 count = 0;
        
        // Find users who confirmed match with target but haven't received confirmation back
        for (uint64 i = 1; i <= activeUsersCount; i++) {
            address candidate = IndexToAddress[i];
            if (mutualMatches[candidate][user] && !mutualMatches[user][candidate]) {
                pending[count] = candidate;
                count++;
            }
        }
        
        // Return properly sized array containing only valid pending matches
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pending[i];
        }
        
        return result;
    }
    
    /**
     * @notice Retrieves complete encrypted profile data for specified user
     * @dev Returns all profile fields for frontend decryption and display
     * @param userAddress Address of user whose profile to retrieve
     * @return countryCode Encrypted country code for phone number
     * @return leadingZero Encrypted leading zero indicator
     * @return encryptedPhoneNumber Encrypted complete phone number
     * @return age Encrypted age in years
     * @return location Encrypted location/region code
     * @return gender Encrypted gender identity
     * @return interestedIn Encrypted gender preference
     * @return preference1 Encrypted first interest/hobby preference
     * @return preference2 Encrypted second interest/hobby preference
     * @return preference3 Encrypted third interest/hobby preference
     * @return isActive Public flag indicating profile activity status
     * @custom:privacy Encrypted fields can only be decrypted by authorized addresses
     * @custom:permissions Respects FHE access controls set during registration/updates
     */
    function getProfile(address userAddress) external view returns (
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
        UserProfile storage profile = profiles[userAddress];
        
        return (
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
     * @notice Checks registration status of specified user address
     * @dev Simple validation function for frontend and other contract functions
     * @param user Address to check for registration
     * @return bool True if user has completed registration process
     * @custom:usage Used for access control validation and UI state management
     */
    function isUserRegistered(address user) external view returns (bool) {
        return isRegistered[user];
    }

    /**
     * @notice Retrieves user's current best match information
     * @dev Returns encrypted match data from latest search operation
     * @param user Address of user whose match information to retrieve
     * @return score Encrypted compatibility score with best match
     * @return matchIndex Encrypted index of best matched user
     * @return isValid Boolean indicating if match data is current and valid
     * @custom:privacy Match score and index remain encrypted until user decrypts them
     * @custom:permissions Only accessible by users with proper FHE decryption rights
     */
    function getBestMatch(address user) external view returns (euint8 score, euint64 matchIndex, bool isValid) {
        Match storage matched = userBestMatch[user];
        return (matched.score, matched.matchIndex, matched.isValid);
    }
    
    /**
     * @notice Checks if user currently has a valid match result
     * @dev Quick boolean check for match availability
     * @param user Address to check for valid match
     * @return bool True if user has performed search and has valid match data
     * @custom:usage Enables frontend to determine if match data should be displayed
     */
    function hasMatch(address user) external view returns (bool) {
        return userBestMatch[user].isValid;
    }
    
    /**
     * @notice Deactivates user profile to exclude from matching algorithms
     * @dev Sets profile to inactive state while preserving all data
     * @custom:preservation Maintains all profile data and relationships
     * @custom:matching Inactive profiles are skipped during other users' searches
     * @custom:reversible Can be reactivated using reactivateProfile()
     */
    function deactivateProfile() external onlyRegistered {
        profiles[msg.sender].isActive = false;
    }
    
    /**
     * @notice Reactivates previously deactivated user profile
     * @dev Restores profile to active state for inclusion in matching
     * @custom:restoration Makes profile visible in other users' searches again
     * @custom:preservation All existing data and relationships remain intact
     */
    function reactivateProfile() external onlyRegistered {
        profiles[msg.sender].isActive = true;
    }
}