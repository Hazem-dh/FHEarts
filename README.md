# FHEarts

A privacy-first dating app using Fully Homomorphic Encryption (FHE) powered by ZAMA technology.
## Screenshots

<p align="center">
<img width="500" height="500" alt="Screenshot 3" src="https://github.com/user-attachments/assets/ddb70140-d1fd-4764-a37f-74dee59ee067" />
<p/>   
<p align="center">
   <img width="500" height="500" alt="Screenshot from 2025-08-28 10-20-06" src="https://github.com/user-attachments/assets/95f1386b-8fce-46f9-be24-138bf0e24f32" />
<p/>
   <p align="center">
   <img width="500" height="500" alt="Screenshot 2" src="https://github.com/user-attachments/assets/63811b16-d4f6-40c2-aefb-ef7cc5d092e3" />
<p/>


## What it does

FHEarts encrypts user profiles and preferences before storing them on the blockchain. Smart contracts calculate compatibility scores on encrypted data to find matches without exposing personal information.

Due to UX and scalability considerations, the app currently finds one best match rather than multiple options.

## Key Features

- **Encrypted profiles**: All data encrypted client-side using ZAMA FHE
- **Private matching**: Compatibility calculated on encrypted data
- **Best match**: Finds your most compatible partner
- **Blockchain ecrypted storage**: Profiles stored securely and encrypted on-chain

## How it works

1. User creates profile and data gets encrypted locally  
2. Profile stored on blockchain in encrypted form  
3. Smart contract calculates compatibility scores using FHE  
4. Best match returned while keeping all data private  

## App Flow

1. A user searches for a match  
2. The system either:  
   - Suggests their best available match, or  
   - Tells them they’ve been matched with someone else  
3. Both users must **consent to the match**  
4. Once both consent, they can **decrypt each other’s phone numbers**  
5. In the future, with encrypted strings, users could also securely exchange **social media links or other contact details**  

## Installation

### Prerequisites
- Node.js 
- Alchemy API key
- Etherscan API key
- Ethereum wallet private key

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Hazem-dh/FHEarts.git
cd fhearts
```
2. **Smart Contracts Setup**
```bash
cd Smart\ contracts
npm install
```
3.  **Create environment file**
Create a .env file in the Smart contracts directory with your API keys:
```bash
ALCHEMY_API_KEY=your_alchemy_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
PRIVATE_KEY=your_wallet_private_key_here
```
 4.  **Deploy Smart Contracts**
```bash
npx hardhat --network sepolia deploy
```
 5.  **Frontend Setup**
```bash
cd frontend
npm install
./CopyCopySCMetadata
```

## Planned Improvements

- Multiple match options  
- Enhanced preference system  
- Better UX  
- Encrypted strings (e.g., secure sharing of social media links once supported by ZAMA FHE)  

## Tech Stack

- React + TypeScript frontend  
- ZAMA FHE for encryption  
- Ethereum smart contracts (Sepolia testnet)  
- Wagmi for Web3 integration  

Broader Applications

While FHEarts focuses on dating, the same architecture can be applied to other use cases:  

- **Job matching**: Employers and candidates matched privately on skills and preferences  
- **Mentorship platforms**: Secure pairing of mentors and mentees without revealing sensitive data upfront  
- **Networking**: Privacy-preserving social or professional matchmaking
  
## ⚠️Warning
All features have been tested on the frontend, but the project is still experimental.
There might be bugs or unexpected behavior.

## Contributing

1. Fork the repo  
2. Create feature branch  
3. Make changes  
4. Submit pull request  

## License

MIT
