// Auto-generated contract ABI
// This file is automatically updated from the deployment folder

export const ABI = 
[
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BATCH_SIZE",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "name": "IndexToAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_MATCHES",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_PREFERENCE_VALUE",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "activeUsersCount",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "matchedUserIndex",
        "type": "uint64"
      }
    ],
    "name": "confirmMatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deactivateProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getMatchStatus",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "matchCount",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "currentBatch",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "searchComplete",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "matchedUser",
        "type": "address"
      }
    ],
    "name": "givePhoneConsent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user1",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "user2",
        "type": "address"
      }
    ],
    "name": "hasMutualPhoneConsent",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "hasPendingMatches",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isRegistered",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "matchStates",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "currentBatch",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "matchCount",
        "type": "uint8"
      },
      {
        "internalType": "euint8",
        "name": "maxScore",
        "type": "bytes32"
      },
      {
        "internalType": "euint64",
        "name": "maxScoreIndex",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "searchComplete",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "mutualMatches",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "phoneConsent",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "profiles",
    "outputs": [
      {
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      },
      {
        "internalType": "euint8",
        "name": "countryCode",
        "type": "bytes32"
      },
      {
        "internalType": "euint8",
        "name": "leadingZero",
        "type": "bytes32"
      },
      {
        "internalType": "euint64",
        "name": "encryptedPhoneNumber",
        "type": "bytes32"
      },
      {
        "internalType": "euint8",
        "name": "age",
        "type": "bytes32"
      },
      {
        "internalType": "euint8",
        "name": "location",
        "type": "bytes32"
      },
      {
        "internalType": "euint8",
        "name": "gender",
        "type": "bytes32"
      },
      {
        "internalType": "euint8",
        "name": "interestedIn",
        "type": "bytes32"
      },
      {
        "internalType": "euint8",
        "name": "preference1",
        "type": "bytes32"
      },
      {
        "internalType": "euint8",
        "name": "preference2",
        "type": "bytes32"
      },
      {
        "internalType": "euint8",
        "name": "preference3",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reactivateProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint8",
        "name": "countryCode",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "leadingZero",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint64",
        "name": "encryptedPhoneNumber",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "age",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "location",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "gender",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "interestedIn",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "preference1",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "preference2",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "preference3",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "registerUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "resetMatchSearch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "requester",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "accept",
        "type": "bool"
      }
    ],
    "name": "respondToMatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "searchMatches",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint8",
        "name": "countryCode",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "leadingZero",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint64",
        "name": "encryptedPhoneNumber",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "age",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "location",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "gender",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "interestedIn",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "preference1",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "preference2",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "preference3",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "updateProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userActiveIndex",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userMatches",
    "outputs": [
      {
        "internalType": "euint8",
        "name": "score",
        "type": "bytes32"
      },
      {
        "internalType": "euint64",
        "name": "matchIndex",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
