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

  describe("Simplified Matching Flow", function () {
    it("Alice searches and finds encrypted best match", async function () {
      // Alice searches for matches (processes all users in one transaction)
      await FHEartsContract.connect(signers.alice).searchMatches();

      // Verify Alice has found a match
      const hasMatch = await FHEartsContract.hasMatch(signers.alice.address);
      expect(hasMatch).to.be.true;

      // Get the encrypted best match data
      const [encryptedScore, encryptedMatchIndex, isValid] =
        await FHEartsContract.getBestMatch(signers.alice.address);
      expect(isValid).to.be.true;

      // In a real scenario, Alice would decrypt the matchIndex to find out who she matched with
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

      // Get Bob's encrypted best match
      const [, encryptedMatchIndex, isValid] =
        await FHEartsContract.getBestMatch(signers.bob.address);
      expect(isValid).to.be.true;

      // Bob decrypts the match index
      const decryptedIndex = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        encryptedMatchIndex,
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

      // Get Charlie's best match
      const [, encryptedMatchIndex, isValid] =
        await FHEartsContract.getBestMatch(signers.charlie.address);
      expect(isValid).to.be.true;

      // Charlie decrypts to find his match
      const decryptedIndex = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        encryptedMatchIndex,
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

  describe("Match Management", function () {
    it("Should allow users to clear their match and search again", async function () {
      // Alice clears her current match
      await FHEartsContract.connect(signers.alice).clearMatch();

      // Verify match is cleared
      const hasMatch = await FHEartsContract.hasMatch(signers.alice.address);
      expect(hasMatch).to.be.false;

      // Alice can search again
      await FHEartsContract.connect(signers.alice).searchMatches();

      // Should have a match again
      const hasNewMatch = await FHEartsContract.hasMatch(signers.alice.address);
      expect(hasNewMatch).to.be.true;
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

      // Match should be cleared
      const hasMatch = await FHEartsContract.hasMatch(signers.alice.address);
      expect(hasMatch).to.be.false;
    });
  });

  describe("Profile Activation", function () {
    it("Should allow users to deactivate and reactivate profiles", async function () {
      // Deactivate Alice's profile
      await FHEartsContract.connect(signers.alice).deactivateProfile();

      // Check profile is inactive
      const aliceProfile = await FHEartsContract.profiles(
        signers.alice.address
      );
      expect(aliceProfile.isActive).to.be.false;

      // Reactivate profile
      await FHEartsContract.connect(signers.alice).reactivateProfile();

      // Check profile is active again
      const reactivatedProfile = await FHEartsContract.profiles(
        signers.alice.address
      );
      expect(reactivatedProfile.isActive).to.be.true;
    });
  });

  describe("View Functions", function () {
    it("Should correctly identify registered users", async function () {
      expect(await FHEartsContract.isUserRegistered(signers.alice.address)).to
        .be.true;
      expect(await FHEartsContract.isUserRegistered(signers.deployer.address))
        .to.be.false;
    });

    it("Should return user profile data", async function () {
      const profile = await FHEartsContract.getProfile(signers.bob.address);
      expect(profile.isActive).to.be.true;
      expect(profile.countryCode).to.not.be.undefined;
      expect(profile.encryptedPhoneNumber).to.not.be.undefined;
    });
  });
  // Additional comprehensive test cases to add to the existing FHEarts test suite

  describe("Error Handling & Input Validation", function () {
    it("Should revert when user tries to register twice", async function () {
      // Try to register Alice again (she's already registered in before hook)
      const duplicateInput = fhevm.createEncryptedInput(
        fheFHEartsContractAddress,
        signers.alice.address
      );
      duplicateInput.add8(1);
      duplicateInput.add8(0);
      duplicateInput.add64(1234567890);
      duplicateInput.add8(25);
      duplicateInput.add8(1);
      duplicateInput.add8(1);
      duplicateInput.add8(0);
      duplicateInput.add8(1);
      duplicateInput.add8(2);
      duplicateInput.add8(3);

      const duplicateEncrypted = await duplicateInput.encrypt();

      await expect(
        FHEartsContract.connect(signers.alice).registerUser(
          duplicateEncrypted.handles[0],
          duplicateEncrypted.handles[1],
          duplicateEncrypted.handles[2],
          duplicateEncrypted.handles[3],
          duplicateEncrypted.handles[4],
          duplicateEncrypted.handles[5],
          duplicateEncrypted.handles[6],
          duplicateEncrypted.handles[7],
          duplicateEncrypted.handles[8],
          duplicateEncrypted.handles[9],
          duplicateEncrypted.inputProof
        )
      ).to.be.revertedWith("User already registered");
    });

    it("Should revert when unregistered user calls protected functions", async function () {
      const [, , , , unregistered] = await ethers.getSigners();

      await expect(
        FHEartsContract.connect(unregistered).searchMatches()
      ).to.be.revertedWith("User not registered");

      await expect(
        FHEartsContract.connect(unregistered).confirmMatch(1)
      ).to.be.revertedWith("User not registered");

      await expect(
        FHEartsContract.connect(unregistered).clearMatch()
      ).to.be.revertedWith("User not registered");

      await expect(
        FHEartsContract.connect(unregistered).deactivateProfile()
      ).to.be.revertedWith("User not registered");
    });

    it("Should revert when searching with insufficient users", async function () {
      // Deploy a fresh contract with only one user
      const factory = (await ethers.getContractFactory(
        "FHEarts"
      )) as FHEarts__factory;
      const freshContract = (await factory.deploy()) as FHEarts;
      const freshAddress = await freshContract.getAddress();

      // Register only one user
      const soloInput = fhevm.createEncryptedInput(
        freshAddress,
        signers.alice.address
      );
      soloInput.add8(1);
      soloInput.add8(0);
      soloInput.add64(1111111111);
      soloInput.add8(25);
      soloInput.add8(1);
      soloInput.add8(1);
      soloInput.add8(0);
      soloInput.add8(1);
      soloInput.add8(2);
      soloInput.add8(3);

      const soloEncrypted = await soloInput.encrypt();
      await freshContract
        .connect(signers.alice)
        .registerUser(
          soloEncrypted.handles[0],
          soloEncrypted.handles[1],
          soloEncrypted.handles[2],
          soloEncrypted.handles[3],
          soloEncrypted.handles[4],
          soloEncrypted.handles[5],
          soloEncrypted.handles[6],
          soloEncrypted.handles[7],
          soloEncrypted.handles[8],
          soloEncrypted.handles[9],
          soloEncrypted.inputProof
        );

      await expect(
        freshContract.connect(signers.alice).searchMatches()
      ).to.be.revertedWith("Not enough users for matching");
    });

    it("Should revert when confirming invalid match index", async function () {
      await expect(
        FHEartsContract.connect(signers.alice).confirmMatch(999) // Invalid index
      ).to.be.revertedWith("Invalid matched user");

      await expect(
        FHEartsContract.connect(signers.alice).confirmMatch(0) // Index 0 should be invalid
      ).to.be.revertedWith("Invalid matched user");
    });

    it("Should revert when giving phone consent without mutual match", async function () {
      // Create a new user who hasn't matched with Alice
      const [, , , , newUser] = await ethers.getSigners();

      const newInput = fhevm.createEncryptedInput(
        fheFHEartsContractAddress,
        newUser.address
      );
      newInput.add8(1);
      newInput.add8(0);
      newInput.add64(5555555555);
      newInput.add8(30);
      newInput.add8(1);
      newInput.add8(0);
      newInput.add8(1);
      newInput.add8(1);
      newInput.add8(2);
      newInput.add8(3);

      const newEncrypted = await newInput.encrypt();
      await FHEartsContract.connect(newUser).registerUser(
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

      await expect(
        FHEartsContract.connect(signers.alice).givePhoneConsent(newUser.address)
      ).to.be.revertedWith("No confirmed match with this user");
    });
  });

  describe("State Management & Consistency", function () {
    it("Should prevent responding to non-existent match requests", async function () {
      await expect(
        FHEartsContract.connect(signers.alice).respondToMatch(
          signers.charlie.address,
          true
        )
      ).to.be.revertedWith("No match request from this user");
    });

    it("Should handle clearing matches while having pending requests", async function () {
      // Alice has pending requests, then clears her match
      const pendingBefore = await FHEartsContract.hasPendingMatches(
        signers.alice.address
      );

      await FHEartsContract.connect(signers.alice).clearMatch();

      // Pending matches should still exist (clearing match doesn't affect incoming requests)
      const pendingAfter = await FHEartsContract.hasPendingMatches(
        signers.alice.address
      );
      expect(pendingAfter.length).to.equal(pendingBefore.length);
    });

    it("Should maintain index consistency after profile updates", async function () {
      const initialCount = await FHEartsContract.activeUsersCount();
      const aliceIndex = await FHEartsContract.userActiveIndex(
        signers.alice.address
      );

      // Alice updates her profile
      const updateInput = fhevm.createEncryptedInput(
        fheFHEartsContractAddress,
        signers.alice.address
      );
      updateInput.add8(1);
      updateInput.add8(0);
      updateInput.add64(9999999999);
      updateInput.add8(26);
      updateInput.add8(2);
      updateInput.add8(1);
      updateInput.add8(0);
      updateInput.add8(4);
      updateInput.add8(5);
      updateInput.add8(6);

      const updateEncrypted = await updateInput.encrypt();
      await FHEartsContract.connect(signers.alice).updateProfile(
        updateEncrypted.handles[0],
        updateEncrypted.handles[1],
        updateEncrypted.handles[2],
        updateEncrypted.handles[3],
        updateEncrypted.handles[4],
        updateEncrypted.handles[5],
        updateEncrypted.handles[6],
        updateEncrypted.handles[7],
        updateEncrypted.handles[8],
        updateEncrypted.handles[9],
        updateEncrypted.inputProof
      );

      // Index and count should remain the same
      expect(await FHEartsContract.activeUsersCount()).to.equal(initialCount);
      expect(
        await FHEartsContract.userActiveIndex(signers.alice.address)
      ).to.equal(aliceIndex);
      expect(await FHEartsContract.IndexToAddress(aliceIndex)).to.equal(
        signers.alice.address
      );
    });
  });

  describe("FHE Permissions & Security", function () {
    it("Should fail decryption without proper permissions", async function () {
      // Charlie tries to decrypt Alice's phone without consent
      const aliceProfile = await FHEartsContract.profiles(
        signers.alice.address
      );

      await expect(
        fhevm.userDecryptEuint(
          FhevmType.euint64,
          aliceProfile.encryptedPhoneNumber,
          fheFHEartsContractAddress,
          signers.charlie
        )
      ).to.be.rejected; // Should fail due to lack of permissions
    });
  });

  describe("Gas Optimization & Performance", function () {
    it("Should measure gas costs for different operations", async function () {
      // Measure gas for registration
      const registrationTx = await FHEartsContract.connect(
        signers.alice
      ).clearMatch();
      const registrationReceipt = await registrationTx.wait();
      console.log(
        `Clear match gas used: ${registrationReceipt?.gasUsed?.toString()}`
      );

      // Measure gas for search
      const searchTx = await FHEartsContract.connect(
        signers.alice
      ).searchMatches();
      const searchReceipt = await searchTx.wait();
      console.log(
        `Search matches gas used: ${searchReceipt?.gasUsed?.toString()}`
      );

      // Gas usage should be reasonable (under certain limits)
      expect(Number(searchReceipt?.gasUsed || 0)).to.be.lessThan(5000000); // 5M gas limit
    });

    it("Should handle reasonable number of users efficiently", async function () {
      // This test verifies the contract can handle multiple users without timing out
      const userCount = await FHEartsContract.activeUsersCount();
      expect(userCount).to.be.greaterThan(3);

      // Search should complete in reasonable time even with multiple users
      const startTime = Date.now();
      await FHEartsContract.connect(signers.alice).searchMatches();
      const endTime = Date.now();

      console.log(
        `Search with ${userCount} users took: ${endTime - startTime}ms`
      );
      // In test environment, should complete quickly
      expect(endTime - startTime).to.be.lessThan(30000); // 30 seconds max
    });
  });

  describe("Data Integrity & Consistency", function () {
    it("Should maintain data consistency across multiple operations", async function () {
      const initialUserCount = await FHEartsContract.activeUsersCount();

      // Perform multiple operations
      await FHEartsContract.connect(signers.alice).clearMatch();
      await FHEartsContract.connect(signers.bob).clearMatch();
      await FHEartsContract.connect(signers.charlie).clearMatch();

      await FHEartsContract.connect(signers.alice).searchMatches();
      await FHEartsContract.connect(signers.bob).searchMatches();

      // User count should remain consistent
      expect(await FHEartsContract.activeUsersCount()).to.equal(
        initialUserCount
      );

      // All users should still be registered
      expect(await FHEartsContract.isUserRegistered(signers.alice.address)).to
        .be.true;
      expect(await FHEartsContract.isUserRegistered(signers.bob.address)).to.be
        .true;
      expect(await FHEartsContract.isUserRegistered(signers.charlie.address)).to
        .be.true;
    });

    it("Should handle rapid successive operations correctly", async function () {
      // Rapid clear and search operations
      await FHEartsContract.connect(signers.alice).clearMatch();
      await FHEartsContract.connect(signers.alice).searchMatches();
      await FHEartsContract.connect(signers.alice).clearMatch();
      await FHEartsContract.connect(signers.alice).searchMatches();

      // Should still have a valid match
      const hasMatch = await FHEartsContract.hasMatch(signers.alice.address);
      expect(hasMatch).to.be.true;

      const [, , isValid] = await FHEartsContract.getBestMatch(
        signers.alice.address
      );
      expect(isValid).to.be.true;
    });
  });
});
