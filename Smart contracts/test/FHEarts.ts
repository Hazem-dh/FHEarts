import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHEarts, FHEarts__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

describe("FHEarts Dating Contract", function () {
  let signers: Signers;
  let FHEartsContract: FHEarts;
  let fheFHEartsContractAddress: string;

  before(async function () {
    // Get signers
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3],
    };

    // Deploy contract
    const factory = (await ethers.getContractFactory(
      "FHEarts"
    )) as FHEarts__factory;
    FHEartsContract = (await factory.deploy()) as FHEarts;
    fheFHEartsContractAddress = await FHEartsContract.getAddress();

    // Register Alice (25yo female interested in males)
    const aliceInput = fhevm.createEncryptedInput(
      fheFHEartsContractAddress,
      signers.alice.address
    );
    aliceInput.add8(1); // country code
    aliceInput.add8(0); // leading zero
    aliceInput.add64(2235497654); // phone number
    aliceInput.add8(25); // age
    aliceInput.add8(1); // location
    aliceInput.add8(1); // gender (female)
    aliceInput.add8(0); // interestedIn (male)
    aliceInput.add8(2); // preference1 (hiking)
    aliceInput.add8(3); // preference2 (movies)
    aliceInput.add8(5); // preference3 (cooking)

    const aliceEncrypted = await aliceInput.encrypt();
    await FHEartsContract.connect(signers.alice).registerUser(
      aliceEncrypted.handles[0],
      aliceEncrypted.handles[1],
      aliceEncrypted.handles[2],
      aliceEncrypted.handles[3],
      aliceEncrypted.handles[4],
      aliceEncrypted.handles[5],
      aliceEncrypted.handles[6],
      aliceEncrypted.handles[7],
      aliceEncrypted.handles[8],
      aliceEncrypted.handles[9],
      aliceEncrypted.inputProof
    );

    // Register Bob (28yo male interested in females, 2/3 match with Alice)
    const bobInput = fhevm.createEncryptedInput(
      fheFHEartsContractAddress,
      signers.bob.address
    );
    bobInput.add8(1); // country code
    bobInput.add8(0); // leading zero
    bobInput.add64(3345598765); // phone number
    bobInput.add8(28); // age
    bobInput.add8(1); // location (same as Alice)
    bobInput.add8(0); // gender (male)
    bobInput.add8(1); // interestedIn (female)
    bobInput.add8(2); // preference1 (hiking - match!)
    bobInput.add8(3); // preference2 (movies - match!)
    bobInput.add8(7); // preference3 (gaming - no match)

    const bobEncrypted = await bobInput.encrypt();
    await FHEartsContract.connect(signers.bob).registerUser(
      bobEncrypted.handles[0],
      bobEncrypted.handles[1],
      bobEncrypted.handles[2],
      bobEncrypted.handles[3],
      bobEncrypted.handles[4],
      bobEncrypted.handles[5],
      bobEncrypted.handles[6],
      bobEncrypted.handles[7],
      bobEncrypted.handles[8],
      bobEncrypted.handles[9],
      bobEncrypted.inputProof
    );

    // Register Charlie (30yo male interested in females, 2/3 match with Alice)
    const charlieInput = fhevm.createEncryptedInput(
      fheFHEartsContractAddress,
      signers.charlie.address
    );
    charlieInput.add8(1); // country code
    charlieInput.add8(0); // leading zero
    charlieInput.add64(4456609876); // phone number
    charlieInput.add8(30); // age
    charlieInput.add8(2); // location (different)
    charlieInput.add8(0); // gender (male)
    charlieInput.add8(1); // interestedIn (female)
    charlieInput.add8(1); // preference1 (reading - no match)
    charlieInput.add8(3); // preference2 (movies - match!)
    charlieInput.add8(5); // preference3 (cooking - match!)

    const charlieEncrypted = await charlieInput.encrypt();
    await FHEartsContract.connect(signers.charlie).registerUser(
      charlieEncrypted.handles[0],
      charlieEncrypted.handles[1],
      charlieEncrypted.handles[2],
      charlieEncrypted.handles[3],
      charlieEncrypted.handles[4],
      charlieEncrypted.handles[5],
      charlieEncrypted.handles[6],
      charlieEncrypted.handles[7],
      charlieEncrypted.handles[8],
      charlieEncrypted.handles[9],
      charlieEncrypted.inputProof
    );
  });

  describe("Registration Verification", function () {
    it("Should have registered all three users", async function () {
      expect(await FHEartsContract.isRegistered(signers.alice.address)).to.be
        .true;
      expect(await FHEartsContract.isRegistered(signers.bob.address)).to.be
        .true;
      expect(await FHEartsContract.isRegistered(signers.charlie.address)).to.be
        .true;
      expect(await FHEartsContract.activeUsersCount()).to.equal(3);
    });
  });

  describe("Realistic Matching Flow", function () {
    it("Alice searches and finds encrypted match", async function () {
      // Alice searches for matches
      await FHEartsContract.connect(signers.alice).searchMatches();

      // Verify search is complete
      const [matchCount, , searchComplete] =
        await FHEartsContract.getMatchStatus(signers.alice.address);

      expect(searchComplete).to.be.true;
      expect(matchCount).to.equal(1);

      // Get the encrypted match data
      const match = await FHEartsContract.userMatches(signers.alice.address, 0);
      expect(match.isValid).to.be.true;

      // In a real scenario, Alice would decrypt the matchIndex to find out who she matched with
      // For testing, we'll decrypt the encrypted index
      const encryptedMatchIndex = match.matchIndex;

      // Decrypt the match index (Alice needs to decrypt to know who she matched with)
      const decryptedIndex = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        encryptedMatchIndex,
        fheFHEartsContractAddress,
        signers.alice
      );

      // Now Alice knows the index, she can look up the address
      const matchedUserAddress =
        await FHEartsContract.IndexToAddress(decryptedIndex);

      // Verify it's either Bob or Charlie (both are compatible)
      expect([signers.bob.address, signers.charlie.address]).to.include(
        matchedUserAddress
      );

      // Alice can also decrypt the match score to see compatibility
      const encryptedScore = match.score;
      const decryptedScore = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encryptedScore,
        fheFHEartsContractAddress,
        signers.alice
      );

      // Score should be 66 (2 out of 3 preferences match = 2 * 33)
      expect(decryptedScore).to.equal(66);

      // Now Alice confirms the match using the decrypted index
      await FHEartsContract.connect(signers.alice).confirmMatch(decryptedIndex);

      expect(
        await FHEartsContract.mutualMatches(
          signers.alice.address,
          matchedUserAddress
        )
      ).to.be.true;
    });

    it("Bob searches, decrypts match, and responds", async function () {
      // Bob searches for matches
      await FHEartsContract.connect(signers.bob).searchMatches();

      // Get Bob's encrypted match
      const match = await FHEartsContract.userMatches(signers.bob.address, 0);

      // Bob decrypts the match index
      const decryptedIndex = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        match.matchIndex,
        fheFHEartsContractAddress,
        signers.bob
      );

      // Bob looks up who he matched with
      const matchedUserAddress =
        await FHEartsContract.IndexToAddress(decryptedIndex);

      // Should be Alice (index 1)
      expect(matchedUserAddress).to.equal(signers.alice.address);

      // Bob confirms match with Alice
      await FHEartsContract.connect(signers.bob).confirmMatch(decryptedIndex);

      // Check if Alice already matched with Bob (from previous test)
      const aliceConfirmed = await FHEartsContract.mutualMatches(
        signers.alice.address,
        signers.bob.address
      );

      if (aliceConfirmed) {
        // Bob responds to Alice's match request
        await FHEartsContract.connect(signers.bob).respondToMatch(
          signers.alice.address,
          true
        );

        expect(
          await FHEartsContract.mutualMatches(
            signers.bob.address,
            signers.alice.address
          )
        ).to.be.true;
      }
    });

    it("Complete phone consent flow with decryption", async function () {
      // First, both users need to have mutual match
      // Alice already confirmed Bob from previous tests
      // Bob responds if not already done
      const bobMatch = await FHEartsContract.mutualMatches(
        signers.bob.address,
        signers.alice.address
      );

      if (!bobMatch) {
        await FHEartsContract.connect(signers.bob).respondToMatch(
          signers.alice.address,
          true
        );
      }

      // Alice gives phone consent
      await FHEartsContract.connect(signers.alice).givePhoneConsent(
        signers.bob.address
      );

      // Bob gives phone consent
      await FHEartsContract.connect(signers.bob).givePhoneConsent(
        signers.alice.address
      );

      // Verify mutual consent
      expect(
        await FHEartsContract.hasMutualPhoneConsent(
          signers.alice.address,
          signers.bob.address
        )
      ).to.be.true;

      // Now both can decrypt each other's phone numbers
      // Get Alice's encrypted phone data
      const aliceProfile = await FHEartsContract.profiles(
        signers.alice.address
      );

      // Bob can now decrypt Alice's phone number
      const aliceCountryCode = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        aliceProfile.countryCode,
        fheFHEartsContractAddress,
        signers.bob
      );

      const aliceLeadingZero = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        aliceProfile.leadingZero,
        fheFHEartsContractAddress,
        signers.bob
      );

      const alicePhoneNumber = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        aliceProfile.encryptedPhoneNumber,
        fheFHEartsContractAddress,
        signers.bob
      );

      // Verify Bob can decrypt Alice's phone
      expect(aliceCountryCode).to.equal(1);
      expect(aliceLeadingZero).to.equal(0);
      expect(alicePhoneNumber).to.equal(2235497654);

      // Similarly, Alice can decrypt Bob's phone
      const bobProfile = await FHEartsContract.profiles(signers.bob.address);

      const bobPhoneNumber = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobProfile.encryptedPhoneNumber,
        fheFHEartsContractAddress,
        signers.alice
      );

      expect(bobPhoneNumber).to.equal(3345598765);
    });

    it("Charlie searches and handles no mutual interest", async function () {
      // Charlie searches for matches
      await FHEartsContract.connect(signers.charlie).searchMatches();

      // Get Charlie's match
      const match = await FHEartsContract.userMatches(
        signers.charlie.address,
        0
      );

      // Charlie decrypts to find his match
      const decryptedIndex = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        match.matchIndex,
        fheFHEartsContractAddress,
        signers.charlie
      );

      const matchedUserAddress =
        await FHEartsContract.IndexToAddress(decryptedIndex);

      // Should be Alice
      expect(matchedUserAddress).to.equal(signers.alice.address);

      // Charlie confirms match
      await FHEartsContract.connect(signers.charlie).confirmMatch(
        decryptedIndex
      );

      // Check pending matches for Alice
      const pendingMatches = await FHEartsContract.hasPendingMatches(
        signers.alice.address
      );

      // Charlie should be in Alice's pending matches
      expect(pendingMatches).to.include(signers.charlie.address);

      // Alice can choose to reject Charlie's match
      await FHEartsContract.connect(signers.alice).respondToMatch(
        signers.charlie.address,
        false // reject
      );

      // Mutual match should not exist
      expect(
        await FHEartsContract.mutualMatches(
          signers.alice.address,
          signers.charlie.address
        )
      ).to.be.false;
    });
  });

  describe("Profile Management", function () {
    it("Should reset matches when updating profile", async function () {
      // Create new encrypted profile for Alice
      const newInput = fhevm.createEncryptedInput(
        fheFHEartsContractAddress,
        signers.alice.address
      );
      newInput.add8(1);
      newInput.add8(0);
      newInput.add64(9998887776); // new phone
      newInput.add8(26); // new age
      newInput.add8(2); // new location
      newInput.add8(1); // same gender
      newInput.add8(0); // same interest
      newInput.add8(7); // new preferences
      newInput.add8(8);
      newInput.add8(9);

      const newEncrypted = await newInput.encrypt();
      await FHEartsContract.connect(signers.alice).updateProfile(
        newEncrypted.handles[0],
        newEncrypted.handles[1],
        newEncrypted.handles[2],
        newEncrypted.handles[3],
        newEncrypted.handles[4],
        newEncrypted.handles[5],
        newEncrypted.handles[6],
        newEncrypted.handles[7],
        newEncrypted.handles[8],
        newEncrypted.handles[9],
        newEncrypted.inputProof
      );

      // All matches and consents should be reset
      expect(
        await FHEartsContract.mutualMatches(
          signers.alice.address,
          signers.bob.address
        )
      ).to.be.false;

      expect(
        await FHEartsContract.phoneConsent(
          signers.alice.address,
          signers.bob.address
        )
      ).to.be.false;

      const [matchCount, , searchComplete] =
        await FHEartsContract.getMatchStatus(signers.alice.address);
      expect(matchCount).to.equal(0);
      expect(searchComplete).to.be.false;
    });
  });
});
