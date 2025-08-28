import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, usePublicClient } from "wagmi";
import { contract_address } from "../contract/addresses";
import { ABI } from "../contract/ABI";
import { useInstance } from "../hooks/useInstance";
import { toast, ToastContainer } from "react-toastify";
import { ethers } from "ethers";
import "react-toastify/dist/ReactToastify.css";
import { type ProfileData, type ProfileContractResult } from "../types/types";

// Mapping data
const LOCATION_OPTIONS = [
  { label: "🇫🇷 France", value: 0 },
  { label: "🇩🇪 Germany", value: 1 },
  { label: "🇪🇸 Spain", value: 2 },
  { label: "🇮🇹 Italy", value: 3 },
  { label: "🇳🇱 Netherlands", value: 4 },
  { label: "🇧🇪 Belgium", value: 5 },
  { label: "🇨🇭 Switzerland", value: 6 },
  { label: "🇦🇹 Austria", value: 7 },
  { label: "🇵🇹 Portugal", value: 8 },
  { label: "🇸🇪 Sweden", value: 9 },
];

const LOCATION_TO_COUNTRY_CODE: { [key: number]: number } = {
  0: 33, // France
  1: 49, // Germany
  2: 34, // Spain
  3: 39, // Italy
  4: 31, // Netherlands
  5: 32, // Belgium
  6: 41, // Switzerland
  7: 43, // Austria
  8: 351, // Portugal
  9: 46, // Sweden
};

const GENDER_OPTIONS = [
  { label: "Male", value: 0 },
  { label: "Female", value: 1 },
  { label: "Non-binary", value: 2 },
  { label: "Other", value: 3 },
];

const INTERESTED_IN_OPTIONS = [
  { label: "Men", value: 0 },
  { label: "Women", value: 1 },
  { label: "Non-binary", value: 2 },
  { label: "Other", value: 3 },
];

const MOVIE_OPTIONS = [
  { label: "Action/Adventure", value: 0 },
  { label: "Romance/Comedy", value: 1 },
  { label: "Horror/Thriller", value: 2 },
  { label: "Drama/Documentary", value: 3 },
  { label: "Sci-Fi/Fantasy", value: 4 },
];

const ACTIVITY_OPTIONS = [
  { label: "Outdoor Adventures", value: 0 },
  { label: "Cultural Events", value: 1 },
  { label: "Sports & Fitness", value: 2 },
  { label: "Cooking & Dining", value: 3 },
  { label: "Gaming & Technology", value: 4 },
];

const PERSONALITY_OPTIONS = [
  { label: "Introvert", value: 0 },
  { label: "Extrovert", value: 1 },
  { label: "Ambivert", value: 2 },
];

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editedProfile, setEditedProfile] = useState<ProfileData | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [hasDecrypted, setHasDecrypted] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [phoneInput, setPhoneInput] = useState<string>("");

  const navigate = useNavigate();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { instance, isLoading: instanceLoading } = useInstance();

  // Check if user is registered
  useEffect(() => {
    const checkRegistration = async () => {
      if (!publicClient || !address) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await publicClient.readContract({
          address: contract_address,
          abi: ABI,
          functionName: "isRegistered",
          args: [address],
        });

        setIsRegistered(Boolean(result));
      } catch (error) {
        console.error("Error checking registration:", error);
        setIsRegistered(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRegistration();
  }, [address, publicClient]);

  const parsePhoneNumber = (countryCode: number, phoneInput: string) => {
    const digits = phoneInput.replace(/\D/g, "");
    if (!digits) return null;

    const leadingZeros = digits.match(/^0+/)?.[0]?.length || 0;
    const phoneDigits = parseInt(digits.replace(/^0+/, "")) || 0;

    return {
      leadingZeros,
      countryCode,
      phoneDigits,
    };
  };

  const decryptProfilePromise = async () => {
    if (!instance || !publicClient || !address) {
      throw new Error("Encryption system not ready");
    }

    // Get signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Call getMyProfile to get encrypted data
    const result = (await publicClient.readContract({
      address: contract_address,
      abi: ABI,
      functionName: "getProfile",
      args: [address],
    })) as ProfileContractResult;

    // Generate keypair for decryption
    const keypair = instance.generateKeypair();

    // Prepare handle-contract pairs
    const handleContractPairs = [
      { handle: result[0].toString(), contractAddress: contract_address }, // countryCode
      { handle: result[1].toString(), contractAddress: contract_address }, // leadingZero
      { handle: result[2].toString(), contractAddress: contract_address }, // phoneNumber
      { handle: result[3].toString(), contractAddress: contract_address }, // age
      { handle: result[4].toString(), contractAddress: contract_address }, // location
      { handle: result[5].toString(), contractAddress: contract_address }, // gender
      { handle: result[6].toString(), contractAddress: contract_address }, // interestedIn
      { handle: result[7].toString(), contractAddress: contract_address }, // preference1
      { handle: result[8].toString(), contractAddress: contract_address }, // preference2
      { handle: result[9].toString(), contractAddress: contract_address }, // preference3
    ];

    // Create EIP712 signature
    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = "10";
    const contractAddresses = [contract_address];

    const eip712 = instance.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimeStamp,
      durationDays
    );

    const signature = await signer.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification:
          eip712.types.UserDecryptRequestVerification,
      },
      eip712.message
    );

    // Decrypt all values
    const decryptResult = await instance.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace("0x", ""),
      contractAddresses,
      address,
      startTimeStamp,
      durationDays
    );
    console.log("Decrypt result:", decryptResult);
    // Extract decrypted values
    const countryCode = Number(decryptResult[result[1].toString()]);
    const leadingZeros = Number(decryptResult[result[0].toString()]);
    const phoneDigits = Number(decryptResult[result[2].toString()]);
    const age = Number(decryptResult[result[3].toString()]);
    const location = Number(decryptResult[result[4].toString()]);
    const gender = Number(decryptResult[result[5].toString()]);
    const interestedIn = Number(decryptResult[result[6].toString()]);
    const preference1 = Number(decryptResult[result[7].toString()]);
    const preference2 = Number(decryptResult[result[8].toString()]);
    const preference3 = Number(decryptResult[result[9].toString()]);
    // Reconstruct phone number
    const zerosString = "0".repeat(leadingZeros);
    const fullPhoneNumber = `${zerosString}${phoneDigits}`;

    // Create profile object
    const decryptedProfile: ProfileData = {
      phoneNumber: fullPhoneNumber,
      countryCode,
      leadingZeros,
      phoneDigits,
      age,
      location,
      gender,
      interestedIn,
      preference1,
      preference2,
      preference3,
      isActive: Boolean(result[11]),
    };

    return decryptedProfile;
  };

  const handleDecryptProfile = async () => {
    if (!instance || !publicClient || !address) {
      toast.error("Encryption system not ready");
      return;
    }

    setIsDecrypting(true);

    try {
      const decryptedProfile = await toast.promise(decryptProfilePromise(), {
        pending: "🔐 Decrypting profile...",
        success: "✅ Profile decrypted!",
        error: "❌ Decryption failed",
      });
      console.log("Decrypted Profile:", decryptedProfile);
      setProfile(decryptedProfile);
      setEditedProfile(decryptedProfile);
      setPhoneInput(decryptedProfile.phoneNumber);
      setHasDecrypted(true);
    } catch (error) {
      console.error("Error decrypting profile:", error);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleStartEdit = () => {
    setEditedProfile(profile);
    setPhoneInput(profile?.phoneNumber || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setPhoneInput(profile?.phoneNumber || "");
    setIsEditing(false);
  };

  const updateProfilePromise = async () => {
    if (!instance || !address || !editedProfile) {
      throw new Error("Missing required data");
    }

    // Parse phone number
    const phoneData = parsePhoneNumber(
      LOCATION_TO_COUNTRY_CODE[editedProfile.location] || 33,
      phoneInput
    );

    if (!phoneData) {
      throw new Error("Invalid phone number");
    }

    // Create encrypted input buffer
    const buffer = instance.createEncryptedInput(contract_address, address);

    // Add values to buffer
    buffer.add8(BigInt(phoneData.countryCode));
    buffer.add8(BigInt(phoneData.leadingZeros));
    buffer.add64(BigInt(phoneData.phoneDigits));
    buffer.add8(BigInt(editedProfile.age));
    buffer.add8(BigInt(editedProfile.location));
    buffer.add8(BigInt(editedProfile.gender));
    buffer.add8(BigInt(editedProfile.interestedIn));
    buffer.add8(BigInt(editedProfile.preference1));
    buffer.add8(BigInt(editedProfile.preference2));
    buffer.add8(BigInt(editedProfile.preference3));

    const ciphertexts = await buffer.encrypt();

    // Get signer and contract
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contract_address, ABI, signer);

    // Call updateProfile
    const tx = await contract.updateProfile(
      ciphertexts.handles[0], // countryCode
      ciphertexts.handles[1], // leadingZero
      ciphertexts.handles[2], // phoneDigits
      ciphertexts.handles[3], // age
      ciphertexts.handles[4], // location
      ciphertexts.handles[5], // gender
      ciphertexts.handles[6], // interestedIn
      ciphertexts.handles[7], // preference1
      ciphertexts.handles[8], // preference2
      ciphertexts.handles[9], // preference3
      ciphertexts.inputProof
    );

    await tx.wait();

    // Return updated profile data
    return {
      ...editedProfile,
      phoneNumber: phoneInput,
      countryCode: phoneData.countryCode,
      leadingZeros: phoneData.leadingZeros,
      phoneDigits: phoneData.phoneDigits,
    };
  };

  const handleUpdateProfile = async () => {
    if (!instance || !address || !editedProfile) {
      toast.error("Missing required data");
      return;
    }

    setIsUpdating(true);

    try {
      const updatedProfile = await toast.promise(updateProfilePromise(), {
        pending: "🔒 Updating profile...",
        success: "🎉 Profile updated!",
        error: "❌ Update failed",
      });

      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Loading state
  if (isLoading || instanceLoading) {
    return (
      <div className="w-full max-w-lg mx-auto mt-16 px-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {instanceLoading ? "Loading ZAMA..." : "Loading Profile..."}
            </h2>
          </div>
        </div>
        <ToastContainer position="bottom-center" theme="dark" />
      </div>
    );
  }

  // Not registered state
  if (!isRegistered) {
    return (
      <>
        <div className="w-full max-w-lg mx-auto mt-16 px-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Profile Not Found
              </h2>
              <p className="text-white/70 mb-6">
                You need to register on FHEarts first.
              </p>
              <button
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
        <ToastContainer position="bottom-center" theme="dark" />
      </>
    );
  }

  // Registered but not decrypted state
  if (!hasDecrypted) {
    return (
      <>
        <div className="w-full max-w-lg mx-auto mt-16 px-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-3xl">🔒</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Encrypted Profile
              </h2>
              <p className="text-white/70 mb-8 text-sm">
                Your profile is encrypted on the blockchain. Decrypt it to view
                and edit your information.
              </p>
              <button
                onClick={handleDecryptProfile}
                disabled={isDecrypting || !instance}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDecrypting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Decrypting...</span>
                  </div>
                ) : (
                  "🔓 Decrypt Profile"
                )}
              </button>
              {!instance && (
                <p className="text-yellow-400 text-xs mt-3">
                  Loading encryption system...
                </p>
              )}
            </div>
          </div>
        </div>
        <ToastContainer position="bottom-center" theme="dark" />
      </>
    );
  }

  // Decrypted profile display
  return (
    <>
      <div className="w-full max-w-lg mx-auto mt-16 pt-48 px-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-5">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">My Profile</h1>
            <p className="text-white/70 text-sm">
              {isEditing ? "Edit your information" : "Your decrypted profile"}
            </p>
          </div>

          <div className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-white/70 font-medium mb-2 text-sm">
                Phone Number
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <div className="bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-white text-sm">
                    +
                    {LOCATION_TO_COUNTRY_CODE[editedProfile?.location || 0] ||
                      33}
                  </div>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 text-sm"
                    placeholder="0123456789"
                  />
                </div>
              ) : (
                <div className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">
                  +{profile?.countryCode} {profile?.phoneNumber}
                </div>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-white/70 font-medium mb-2 text-sm">
                Age
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={editedProfile?.age || ""}
                  onChange={(e) =>
                    setEditedProfile((prev) =>
                      prev
                        ? { ...prev, age: parseInt(e.target.value) || 0 }
                        : null
                    )
                  }
                  min="18"
                  max="100"
                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 text-sm"
                />
              ) : (
                <div className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">
                  {profile?.age}
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-white/70 font-medium mb-2 text-sm">
                Location
              </label>
              {isEditing ? (
                <select
                  value={editedProfile?.location}
                  onChange={(e) =>
                    setEditedProfile((prev) =>
                      prev
                        ? { ...prev, location: parseInt(e.target.value) }
                        : null
                    )
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-pink-400 text-sm"
                >
                  {LOCATION_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="bg-gray-800"
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">
                  {LOCATION_OPTIONS[profile?.location || 0]?.label}
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-white/70 font-medium mb-2 text-sm">
                Gender
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setEditedProfile((prev) =>
                          prev ? { ...prev, gender: opt.value } : null
                        )
                      }
                      className={`px-3 py-2 rounded-lg text-sm ${
                        editedProfile?.gender === opt.value
                          ? "bg-pink-500 text-white"
                          : "bg-white/20 text-white/80 hover:bg-white/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">
                  {GENDER_OPTIONS[profile?.gender || 0]?.label}
                </div>
              )}
            </div>

            {/* Interested In */}
            <div>
              <label className="block text-white/70 font-medium mb-2 text-sm">
                Interested In
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  {INTERESTED_IN_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setEditedProfile((prev) =>
                          prev ? { ...prev, interestedIn: opt.value } : null
                        )
                      }
                      className={`px-3 py-2 rounded-lg text-sm ${
                        editedProfile?.interestedIn === opt.value
                          ? "bg-purple-500 text-white"
                          : "bg-white/20 text-white/80 hover:bg-white/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">
                  {INTERESTED_IN_OPTIONS[profile?.interestedIn || 0]?.label}
                </div>
              )}
            </div>

            {/* Movie Preference */}
            <div>
              <label className="block text-white/70 font-medium mb-2 text-sm">
                Movie Genre
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  {MOVIE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setEditedProfile((prev) =>
                          prev ? { ...prev, preference1: opt.value } : null
                        )
                      }
                      className={`px-2 py-2 rounded-lg text-xs ${
                        editedProfile?.preference1 === opt.value
                          ? "bg-indigo-500 text-white"
                          : "bg-white/20 text-white/80 hover:bg-white/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">
                  {MOVIE_OPTIONS[profile?.preference1 || 0]?.label}
                </div>
              )}
            </div>

            {/* Activity Preference */}
            <div>
              <label className="block text-white/70 font-medium mb-2 text-sm">
                Activity
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setEditedProfile((prev) =>
                          prev ? { ...prev, preference2: opt.value } : null
                        )
                      }
                      className={`px-2 py-2 rounded-lg text-xs ${
                        editedProfile?.preference2 === opt.value
                          ? "bg-green-500 text-white"
                          : "bg-white/20 text-white/80 hover:bg-white/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">
                  {ACTIVITY_OPTIONS[profile?.preference2 || 0]?.label}
                </div>
              )}
            </div>

            {/* Personality Type */}
            <div>
              <label className="block text-white/70 font-medium mb-2 text-sm">
                Personality
              </label>
              {isEditing ? (
                <div className="flex gap-2">
                  {PERSONALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setEditedProfile((prev) =>
                          prev ? { ...prev, preference3: opt.value } : null
                        )
                      }
                      className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                        editedProfile?.preference3 === opt.value
                          ? "bg-orange-500 text-white"
                          : "bg-white/20 text-white/80 hover:bg-white/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">
                  {PERSONALITY_OPTIONS[profile?.preference3 || 0]?.label}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isUpdating ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      "💾 Save"
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="flex-1 bg-white/20 text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/30 transition-all duration-200 disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={handleDecryptProfile}
                    className="flex-1 bg-white/20 text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/30 transition-all duration-200 text-sm"
                  >
                    🔄 Refresh
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-center" theme="dark" />
    </>
  );
}
