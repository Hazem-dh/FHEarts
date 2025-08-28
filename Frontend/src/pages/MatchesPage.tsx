import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicClient, useAccount, useWriteContract } from "wagmi";
import { contract_address } from "../contract/addresses";
import { ABI } from "../contract/ABI";
import { useInstance } from "../hooks/useInstance";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { type Address } from "viem";

interface MatchData {
  address: string;
  hasMatch: boolean;
  matchScore?: number;
  matchIndex?: string;
  isMutual: boolean;
  hasPhoneConsent: boolean;
  phoneNumber?: string;
  countryCode?: number;
  leadingZero?: number;
}

interface PendingMatch {
  id: number;
  address: string;
}

export function MatchesPage() {
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  const navigate = useNavigate();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const { instance } = useInstance();

  const decryptCiphertext = async (
    ciphertextHandle: string
  ): Promise<string> => {
    if (!instance || !address) {
      throw new Error("Instance or address not available");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const keypair = instance.generateKeypair();
    const handleContractPairs = [
      {
        handle: ciphertextHandle,
        contractAddress: contract_address,
      },
    ];
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

    const result = await instance.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace("0x", ""),
      contractAddresses,
      signer.address,
      startTimeStamp,
      durationDays
    );

    return result[ciphertextHandle].toString();
  };

  const checkRegistrationStatus = async (): Promise<boolean> => {
    try {
      if (!publicClient || !address) {
        return false;
      }

      // Fixed: use correct function name from contract
      const result = await publicClient.readContract({
        address: contract_address as Address,
        abi: ABI,
        functionName: "isUserRegistered", // Changed from "isRegistered"
        args: [address],
      });
      return Boolean(result);
    } catch (error) {
      console.error("Error checking registration status:", error);
      return false;
    }
  };

  const fetchMatchData = async (): Promise<MatchData | null> => {
    try {
      if (!publicClient || !address || !instance) {
        return null;
      }

      // Check if user has a match
      const hasMatch = await publicClient.readContract({
        address: contract_address as Address,
        abi: ABI,
        functionName: "hasMatch",
        args: [address],
      });

      if (!hasMatch) {
        return {
          address: "",
          hasMatch: false,
          isMutual: false,
          hasPhoneConsent: false,
        };
      }

      // Get best match details - returns (euint8 score, euint64 matchIndex, bool isValid)
      const matchResult = (await publicClient.readContract({
        address: contract_address as Address,
        abi: ABI,
        functionName: "getBestMatch",
        args: [address],
      })) as readonly [string, string, boolean]; // [encryptedScore, encryptedMatchIndex, isValid]

      const encryptedScore = matchResult[0];
      const encryptedMatchIndex = matchResult[1];
      const isValid = matchResult[2];

      if (!isValid) {
        return {
          address: "",
          hasMatch: false,
          isMutual: false,
          hasPhoneConsent: false,
        };
      }

      // Decrypt match score and index
      const [decryptedScore, decryptedIndex] = await Promise.all([
        decryptCiphertext(encryptedScore),
        decryptCiphertext(encryptedMatchIndex),
      ]);

      // Get matched user address from index
      const matchedUserAddress = (await publicClient.readContract({
        address: contract_address as Address,
        abi: ABI,
        functionName: "IndexToAddress",
        args: [decryptedIndex],
      })) as Address;

      if (
        !matchedUserAddress ||
        matchedUserAddress === "0x0000000000000000000000000000000000000000"
      ) {
        return {
          address: "",
          hasMatch: false,
          isMutual: false,
          hasPhoneConsent: false,
        };
      }

      // Check if current user has confirmed this match
      const userConfirmed = await publicClient.readContract({
        address: contract_address as Address,
        abi: ABI,
        functionName: "mutualMatches",
        args: [address, matchedUserAddress],
      });

      // Check if matched user has also confirmed (making it mutual)
      const isMutual = await publicClient.readContract({
        address: contract_address as Address,
        abi: ABI,
        functionName: "mutualMatches",
        args: [matchedUserAddress, address],
      });

      // Check phone consent if mutual
      let hasPhoneConsent = false;
      if (userConfirmed && isMutual) {
        hasPhoneConsent = (await publicClient.readContract({
          address: contract_address as Address,
          abi: ABI,
          functionName: "hasMutualPhoneConsent",
          args: [address, matchedUserAddress],
        })) as boolean;
      }

      return {
        address: matchedUserAddress,
        hasMatch: true,
        matchScore: parseInt(decryptedScore),
        matchIndex: decryptedIndex,
        isMutual: Boolean(userConfirmed && isMutual),
        hasPhoneConsent: Boolean(hasPhoneConsent),
      };
    } catch (error) {
      console.error("Error fetching match data:", error);
      return null;
    }
  };

  const fetchPendingMatches = async (): Promise<PendingMatch[]> => {
    try {
      if (!publicClient || !address) {
        return [];
      }

      const pendingAddresses = (await publicClient.readContract({
        address: contract_address as Address,
        abi: ABI,
        functionName: "hasPendingMatches",
        args: [address],
      })) as readonly Address[];

      return pendingAddresses.map((addr, index) => ({
        id: index + 1,
        address: addr,
      }));
    } catch (error) {
      console.error("Error fetching pending matches:", error);
      return [];
    }
  };

  const initializePage = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (!address) {
        setIsRegistered(false);
        return;
      }

      const registered = await checkRegistrationStatus();
      setIsRegistered(registered);

      if (registered) {
        const [match, pending] = await Promise.all([
          fetchMatchData(),
          fetchPendingMatches(),
        ]);

        setMatchData(match);
        setPendingMatches(pending);
      }
    } catch (error) {
      console.error("Error initializing page:", error);
      toast.error("Failed to load matches");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializePage();
  }, [address, publicClient, instance]);

  const handleSearchMatches = async (): Promise<void> => {
    if (!writeContract) {
      toast.error("Write contract not available");
      return;
    }

    setIsSearching(true);
    try {
      const toastId = toast.loading("Searching for your best match...");

      writeContract(
        {
          address: contract_address as Address,
          abi: ABI,
          functionName: "searchMatches",
        },
        {
          onSuccess: () => {
            toast.update(toastId, {
              render: "Search complete!",
              type: "success",
              isLoading: false,
              autoClose: 3000,
            });
            setTimeout(() => initializePage(), 2000);
          },
          onError: (error) => {
            console.error("Search matches error:", error);
            toast.update(toastId, {
              render: "Search failed",
              type: "error",
              isLoading: false,
              autoClose: 3000,
            });
          },
        }
      );
    } catch (error) {
      console.error("Error in handleSearchMatches:", error);
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  // New function to confirm a match (send match request)
  const handleConfirmMatch = async (): Promise<void> => {
    if (!writeContract || !matchData?.matchIndex) {
      toast.error("Write contract or match index not available");
      return;
    }

    setIsConfirming(true);
    try {
      const toastId = toast.loading("Sending match request...");

      writeContract(
        {
          address: contract_address as Address,
          abi: ABI,
          functionName: "confirmMatch",
          args: [matchData.matchIndex],
        },
        {
          onSuccess: () => {
            toast.update(toastId, {
              render: "Match request sent!",
              type: "success",
              isLoading: false,
              autoClose: 3000,
            });
            setTimeout(() => initializePage(), 2000);
          },
          onError: (error) => {
            console.error("Confirm match error:", error);
            toast.update(toastId, {
              render: "Failed to send match request",
              type: "error",
              isLoading: false,
              autoClose: 3000,
            });
          },
        }
      );
    } catch (error) {
      console.error("Error in handleConfirmMatch:", error);
      toast.error("Failed to send match request");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClearMatch = async (): Promise<void> => {
    if (!writeContract) {
      toast.error("Write contract not available");
      return;
    }

    try {
      const toastId = toast.loading("Clearing current match...");

      writeContract(
        {
          address: contract_address as Address,
          abi: ABI,
          functionName: "clearMatch",
        },
        {
          onSuccess: () => {
            toast.update(toastId, {
              render: "Match cleared!",
              type: "success",
              isLoading: false,
              autoClose: 3000,
            });
            setTimeout(() => initializePage(), 2000);
          },
          onError: (error) => {
            console.error("Clear match error:", error);
            toast.update(toastId, {
              render: "Failed to clear match",
              type: "error",
              isLoading: false,
              autoClose: 3000,
            });
          },
        }
      );
    } catch (error) {
      console.error("Error in handleClearMatch:", error);
      toast.error("Failed to clear match");
    }
  };

  const handleGivePhoneConsent = async (): Promise<void> => {
    if (!writeContract || !matchData?.address) {
      toast.error("Write contract or match address not available");
      return;
    }

    try {
      const toastId = toast.loading("Giving phone consent...");

      writeContract(
        {
          address: contract_address as Address,
          abi: ABI,
          functionName: "givePhoneConsent",
          args: [matchData.address as Address],
        },
        {
          onSuccess: () => {
            toast.update(toastId, {
              render: "Phone consent given!",
              type: "success",
              isLoading: false,
              autoClose: 3000,
            });
            setTimeout(() => initializePage(), 2000);
          },
          onError: (error) => {
            console.error("Give phone consent error:", error);
            toast.update(toastId, {
              render: "Failed to give consent",
              type: "error",
              isLoading: false,
              autoClose: 3000,
            });
          },
        }
      );
    } catch (error) {
      console.error("Error in handleGivePhoneConsent:", error);
      toast.error("Failed to give consent");
    }
  };

  const handleDecryptPhone = async (): Promise<void> => {
    if (!matchData?.address || !instance || !publicClient || !address) {
      toast.error("Missing required data for decryption");
      return;
    }

    // Double-check mutual phone consent before attempting decryption
    try {
      const mutualConsent = await publicClient.readContract({
        address: contract_address as Address,
        abi: ABI,
        functionName: "hasMutualPhoneConsent",
        args: [address, matchData.address as Address],
      });

      if (!mutualConsent) {
        toast.error("Mutual phone consent required for decryption");
        return;
      }
    } catch (error) {
      console.error("Error checking mutual consent:", error);
      toast.error("Failed to verify phone consent status");
      return;
    }

    setIsDecrypting(true);
    try {
      // Get the profile data - returns tuple with all profile fields
      const profileData = (await publicClient.readContract({
        address: contract_address as Address,
        abi: ABI,
        functionName: "getProfile",
        args: [matchData.address as Address],
      })) as readonly [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        boolean
      ];

      // Extract the phone-related fields (first 3 fields based on contract)
      const [countryCodeHandle, leadingZeroHandle, phoneNumberHandle] =
        profileData;

      console.log("Profile handles:", {
        countryCode: countryCodeHandle,
        leadingZero: leadingZeroHandle,
        phoneNumber: phoneNumberHandle,
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const keypair = instance.generateKeypair();
      const handleContractPairs = [
        {
          handle: countryCodeHandle,
          contractAddress: contract_address,
        },
        {
          handle: leadingZeroHandle,
          contractAddress: contract_address,
        },
        {
          handle: phoneNumberHandle,
          contractAddress: contract_address,
        },
      ];
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

      console.log("Attempting decryption with handles:", handleContractPairs);

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        signer.address,
        startTimeStamp,
        durationDays
      );

      console.log("Decryption result:", result);

      const countryCode = result[countryCodeHandle];
      const leadingZero = result[leadingZeroHandle];
      const phoneNumber = result[phoneNumberHandle];

      if (
        countryCode === undefined ||
        leadingZero === undefined ||
        phoneNumber === undefined
      ) {
        throw new Error(
          "Decryption returned undefined values - check FHE permissions"
        );
      }

      setMatchData((prev) =>
        prev
          ? {
              ...prev,
              phoneNumber: phoneNumber.toString(),
              countryCode: Number(countryCode),
              leadingZero: Number(leadingZero),
            }
          : null
      );

      toast.success("Phone number decrypted!");
    } catch (error) {
      console.error("Error decrypting phone:", error);

      // Type guard for error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // More specific error messages
      if (
        errorMessage.includes("permission") ||
        errorMessage.includes("unauthorized")
      ) {
        toast.error(
          "Permission denied: Both users must give phone consent first"
        );
      } else if (errorMessage.includes("undefined")) {
        toast.error(
          "Decryption failed: Check if mutual phone consent is properly established"
        );
      } else {
        toast.error(`Decryption failed: ${errorMessage || "Unknown error"}`);
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleRespondToMatch = async (
    matchAddress: string,
    accept: boolean
  ): Promise<void> => {
    if (!writeContract) {
      toast.error("Write contract not available");
      return;
    }

    try {
      const toastId = toast.loading(
        accept ? "Accepting match..." : "Declining match..."
      );

      writeContract(
        {
          address: contract_address as Address,
          abi: ABI,
          functionName: "respondToMatch",
          args: [matchAddress as Address, accept],
        },
        {
          onSuccess: () => {
            toast.update(toastId, {
              render: accept ? "Match accepted!" : "Match declined",
              type: "success",
              isLoading: false,
              autoClose: 3000,
            });
            setTimeout(() => initializePage(), 2000);
          },
          onError: (error) => {
            console.error("Respond to match error:", error);
            toast.update(toastId, {
              render: "Response failed",
              type: "error",
              isLoading: false,
              autoClose: 3000,
            });
          },
        }
      );
    } catch (error) {
      console.error("Error in handleRespondToMatch:", error);
      toast.error("Response failed");
    }
  };

  const handleGoToRegister = (): void => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Loading Matches...
            </h2>
            <p className="text-white/70">
              Fetching your matches from the blockchain
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <>
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="text-6xl mb-6">🔒</div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Registration Required
              </h1>
              <p className="text-white/70 text-lg mb-8">
                You need to register your profile on the blockchain first to
                view matches.
              </p>
              <button
                onClick={handleGoToRegister}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 px-8 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 text-lg"
              >
                Go to Registration
              </button>
            </div>
          </div>
        </div>
        <ToastContainer
          position="bottom-center"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          theme="dark"
        />
      </>
    );
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 text-center border-b border-white/20">
            <h1 className="text-3xl font-bold text-white mb-2">My Matches</h1>
            <p className="text-white/70">Find your perfect connection</p>
          </div>

          {/* Current Match Status */}
          <div className="p-6 border-b border-white/20">
            {!matchData?.hasMatch ? (
              <div className="text-center">
                <div className="text-4xl mb-4">💔</div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  No Match Found
                </h3>
                <button
                  onClick={handleSearchMatches}
                  disabled={isSearching || !instance}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isSearching ? "Searching..." : "Find New Match"}
                </button>
              </div>
            ) : (
              <div className="bg-white/10 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Your Match (Score: {matchData.matchScore}/99)
                    </h3>
                    <p className="text-white font-mono text-sm">
                      {matchData.address}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          matchData.isMutual
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {matchData.isMutual
                          ? "Mutual Match"
                          : "Not Confirmed Yet"}
                      </span>
                      {matchData.isMutual && (
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            matchData.hasPhoneConsent
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {matchData.hasPhoneConsent
                            ? "Phone Shared"
                            : "No Phone Consent"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {/* Show confirm button if user hasn't confirmed match yet */}
                    {!matchData.isMutual && (
                      <button
                        onClick={handleConfirmMatch}
                        disabled={isConfirming}
                        className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                      >
                        {isConfirming ? "Confirming..." : "Send Match Request"}
                      </button>
                    )}

                    {/* Phone consent button for mutual matches */}
                    {matchData.isMutual && !matchData.hasPhoneConsent && (
                      <button
                        onClick={handleGivePhoneConsent}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                      >
                        Give Phone Consent
                      </button>
                    )}

                    {/* Decrypt phone button */}
                    {matchData.hasPhoneConsent && !matchData.phoneNumber && (
                      <button
                        onClick={handleDecryptPhone}
                        disabled={isDecrypting}
                        className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                      >
                        {isDecrypting ? "Decrypting..." : "Get Phone Number"}
                      </button>
                    )}

                    {/* Clear match button */}
                    <button
                      onClick={handleClearMatch}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      Clear Match
                    </button>
                  </div>
                </div>

                {matchData.phoneNumber && (
                  <div className="mt-4 bg-green-500/20 rounded-lg p-4">
                    <h4 className="text-green-400 font-semibold mb-2">
                      Contact Information:
                    </h4>
                    <p className="text-white">
                      +{matchData.countryCode}
                      {matchData.leadingZero === 1 ? "0" : ""}
                      {matchData.phoneNumber}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Actions */}
          <div className="p-6 border-b border-white/20">
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleSearchMatches}
                disabled={isSearching || !instance}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Search for New Matches"}
              </button>
            </div>
          </div>

          {/* Pending Matches */}
          {pendingMatches.length > 0 && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Pending Match Requests ({pendingMatches.length})
              </h2>
              <div className="grid gap-4">
                {pendingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-white/10 rounded-xl p-6 border border-white/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                        👤
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-mono text-sm">
                          {match.address}
                        </p>
                        <p className="text-white/60 text-sm">
                          Wants to match with you
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleRespondToMatch(match.address, true)
                          }
                          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleRespondToMatch(match.address, false)
                          }
                          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="dark"
      />
    </>
  );
}
