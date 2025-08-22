import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHEarts, FHEarts__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory(
    "FHEarts"
  )) as FHEarts__factory;
  const FHEartsContract = (await factory.deploy()) as FHEarts;
  const fheFHEartsContractAddress = await FHEartsContract.getAddress();

  return { FHEartsContract, fheFHEartsContractAddress };
}

describe("FHECounter", function () {
  let signers: Signers;
  let FHEartsContract: FHEarts;
  let fheFHEartsContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
    };
  });

  beforeEach(async () => {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }
    ({ FHEartsContract, fheFHEartsContractAddress } = await deployFixture());
  });

  it("Should register User", async function () {
    const input = fhevm.createEncryptedInput(
      fheFHEartsContractAddress,
      signers.alice.address
    );
    input.add8(1); // country code
    input.add8(0); // leading zero
    input.add64(2235497654); // phone number
    input.add8(25); // age
    input.add8(1); // location
    input.add8(0); // gender
    input.add8(1); // interestedIn
    input.add8(2); // preference1
    input.add8(3); // preference2
    input.add8(4); // preference3

    const encryptedInput = await input.encrypt();

    // Call registerUser with encrypted handles and proof
    await expect(
      FHEartsContract.connect(signers.alice).registerUser(
        encryptedInput.handles[0], // country code
        encryptedInput.handles[1], // leading zero
        encryptedInput.handles[2], // phone number
        encryptedInput.handles[3], // age
        encryptedInput.handles[4], // location
        encryptedInput.handles[5], // gender
        encryptedInput.handles[6], // interestedIn
        encryptedInput.handles[7], // preference1
        encryptedInput.handles[8], // preference2
        encryptedInput.handles[9], // preference3
        encryptedInput.inputProof
      )
    )
      .to.emit(FHEartsContract, "UserRegistered")
      .withArgs(signers.alice.address);

    // Check registration status
    expect(await FHEartsContract.isRegistered(signers.alice.address)).to.be
      .true;
  });

  /* 
    const encryptedCountAfterInc = await fheCounterContract.getCount();
    const clearCountAfterInc = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCountAfterInc,
      fheCounterContractAddress,
      signers.alice,
    );
 */
  // expect(clearCountAfterInc).to.eq(clearCountBeforeInc + clearOne);
});
