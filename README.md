# FHEarts

A privacy-first dating app using Fully Homomorphic Encryption (FHE) powered by ZAMA technology.

## What it does

FHEarts encrypts user profiles and preferences before storing them on the blockchain. Smart contracts calculate compatibility scores on encrypted data to find matches without exposing personal information.

Due to UX and scalability considerations, the app currently finds one best match rather than multiple options.

## Key Features

- **Encrypted profiles**: All data encrypted client-side using ZAMA FHE
- **Private matching**: Compatibility calculated on encrypted data
- **Best match**: Finds your most compatible partner
- **Blockchain storage**: Profiles stored securely on-chain

## How it works

1. User creates profile — data gets encrypted locally  
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

```bash
git clone https://github.com/yourusername/fhearts.git
cd fhearts
npm install
npm run dev
```
 

## Planned Improvements

- Multiple match options  
- Enhanced preference system  
- In-app messaging  
- Encrypted strings (e.g., secure sharing of social media links once supported by ZAMA FHE)  

## Tech Stack

- React + TypeScript frontend  
- ZAMA FHE for encryption  
- Ethereum smart contracts (Sepolia testnet)  
- Wagmi for Web3 integration  

## Broader Applications

While FHEarts focuses on dating, the same architecture can be applied to other use cases:  

- **Job matching**: Employers and candidates matched privately on skills and preferences  
- **Mentorship platforms**: Secure pairing of mentors and mentees without revealing sensitive data upfront  
- **Networking**: Privacy-preserving social or professional matchmaking  

## Contributing

1. Fork the repo  
2. Create feature branch  
3. Make changes  
4. Submit pull request  

## License

MIT
