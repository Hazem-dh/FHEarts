export const ABI =[
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
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "UserRegistered",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "BATCH_SIZE",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
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
      "name": "MATCH_THRESHOLD",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
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
          "name": "intersetedIn",
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
          "name": "intersetedIn",
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
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "userActiveIndex",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]