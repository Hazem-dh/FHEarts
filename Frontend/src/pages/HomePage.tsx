import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contract_address } from "../contract/addresses";
import { ABI } from "../contract/ABI";
import { usePublicClient, useAccount } from "wagmi";
import { RegistrationFlow } from "../components/RegistrationFlow";
import { useInstance } from "../hooks/useInstance";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface RegistrationData {
  leadingZeros: number;
  countryCode: number;
  phoneDigits: number;
  age: number;
  location: number;
  gender: number;
  interestedIn: number;
  preference1: number;
  preference2: number;
  preference3: number;
}

export function HomePage() {
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showRegistration, setShowRegistration] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const navigate = useNavigate();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const {
    instance,
    isLoading: instanceLoading,
    error: instanceError,
  } = useInstance();

  const checkRegistrationStatus = async (): Promise<boolean> => {
    try {
      if (!publicClient || !address) {
        return false;
      }

      const result = await publicClient.readContract({
        address: contract_address,
        abi: ABI,
        functionName: "isRegistered",
        args: [address],
      });
      return Boolean(result);
    } catch (error) {
      console.error("Error checking registration status:", error);
      return false;
    }
  };

  useEffect(() => {
    const fetchStatus = async (): Promise<void> => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const status = await checkRegistrationStatus();
        setIsRegistered(status);
      } catch (error) {
        console.error("Error fetching registration status:", error);
        setIsRegistered(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      fetchStatus();
    } else {
      setIsLoading(false);
      setIsRegistered(false);
    }
  }, [address, publicClient]);

  const handleRegister = (): void => {
    setShowRegistration(true);
  };

  const performRegistration = async (
    formData: RegistrationData
  ): Promise<void> => {
    if (!instance) {
      throw new Error("ZAMA FHE instance not available");
    }

    if (!address) {
      throw new Error("Wallet not connected");
    }

    console.log("Starting registration with ZAMA FHE instance:", instance);
    console.log("Registration data:", formData);
    toast.info("🔐 Encrypting your profile with ZAMA technology...");

    // Create encrypted input buffer
    const buffer = instance.createEncryptedInput(contract_address, address);

    // Add values to buffer
    buffer.add8(BigInt(formData.leadingZeros));
    buffer.add8(BigInt(formData.countryCode));
    buffer.add64(BigInt(formData.phoneDigits));
    buffer.add8(BigInt(formData.age));
    buffer.add8(BigInt(formData.location));
    buffer.add8(BigInt(formData.gender));
    buffer.add8(BigInt(formData.interestedIn));
    buffer.add8(BigInt(formData.preference1));
    buffer.add8(BigInt(formData.preference2));
    buffer.add8(BigInt(formData.preference3));

    console.log("Encrypting dating profile with FHE...");
    const ciphertexts = await buffer.encrypt();
    console.log("Encrypted profile data generated:", ciphertexts);

    // Prepare transaction
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contract_address, ABI, signer);

    // Send transaction
    const tx = await contract.registerUser(
      ciphertexts.handles[0], // leadingZeros
      ciphertexts.handles[1], // countryCode
      ciphertexts.handles[2], // phoneDigits
      ciphertexts.handles[3], // age
      ciphertexts.handles[4], // location
      ciphertexts.handles[5], // gender
      ciphertexts.handles[6], // interestedIn
      ciphertexts.handles[7], // preference1
      ciphertexts.handles[8], // preference2
      ciphertexts.handles[9], // preference3
      ciphertexts.inputProof // proof
    );

    console.log("Encrypted profile transaction sent:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(
      "Profile registration confirmed on blockchain:",
      receipt.blockNumber
    );
  };

  const handleRegistrationComplete = async (
    formData: RegistrationData
  ): Promise<void> => {
    setIsRegistering(true);

    try {
      await toast.promise(performRegistration(formData), {
        pending: "Encrypting profile with FHE...",
        success: "Profile encrypted! 💕 Ready to find matches!",
        error: "Registration failed - please try again",
      });

      // Update state
      setIsRegistered(true);
      setShowRegistration(false);

      // Show additional success message
      setTimeout(() => {
        toast.success("🎉 Welcome to FHEarts!");
      }, 1000);
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegistrationBack = (): void => {
    if (isRegistering) {
      toast.warning("Encryption in progress, please wait...");
      return;
    }
    setShowRegistration(false);
  };

  const performSearch = async (): Promise<void> => {
    if (!instance) {
      throw new Error("ZAMA FHE instance not available");
    }

    if (!address) {
      throw new Error("Wallet not connected");
    }

    console.log("Searching for compatible matches:", instance);
    toast.info("🧮 Computing compatibility scores on encrypted data...");

    try {
      // Prepare transaction using ethers
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contract_address, ABI, signer);

      console.log("Initiating encrypted match calculation...");

      // Call the searchMatches function on the smart contract
      const tx = await contract.searchMatches();

      console.log("Match calculation transaction sent:", tx.hash);
      toast.info("⚡ Processing on blockchain...");

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log("Match calculation completed:", receipt.blockNumber);
    } catch (error) {
      console.error("Error executing match search:", error);
      throw error;
    }
  };

  const handleSearchMatches = async (): Promise<void> => {
    setIsSearching(true);

    try {
      await toast.promise(performSearch(), {
        pending: "🔍 Finding your perfect match...",
        success: "✨ Match found! Privacy preserved!",
        error: "Search failed - please try again",
      });

      setTimeout(() => {
        navigate("/matches");
      }, 1000);
    } catch (error) {
      console.error("Error searching for matches:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Show registration flow if user clicked register
  if (showRegistration) {
    return (
      <>
        <RegistrationFlow
          onComplete={handleRegistrationComplete}
          onBack={handleRegistrationBack}
          isSubmitting={isRegistering}
        />
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

  // Show loading if either registration status or FHE instance is loading
  if (isLoading || instanceLoading) {
    return (
      <div className="w-full max-w-xl mx-auto mt-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-pink-500/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {instanceLoading
                ? " Initializing ZAMA FHE..."
                : " Loading FHEarts..."}
            </h2>
            <p className="text-white/70">
              {instanceLoading
                ? "Setting up privacy encryption"
                : "Connecting to private dating platform"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if FHE instance failed to load
  if (instanceError) {
    return (
      <div className="w-full max-w-xl mx-auto mt-8">
        <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-red-400/30">
          <div className="text-center">
            <div className="text-4xl mb-4">🔒❌</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              FHE System Error
            </h2>
            <p className="text-white/70 mb-4">
              Unable to initialize ZAMA technology: {instanceError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-xl mx-auto mt-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-pink-500/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
              FHEarts
            </h1>
            <p className="text-white/80 text-lg mb-3">
              Privacy-First Dating Platform
            </p>
            <div className="inline-flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30">
              <span className="text-xs text-purple-300">Powered by ZAMA</span>
            </div>
          </div>

          {!isRegistered ? (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-br from-pink-500/10 to-purple-600/10 rounded-xl p-6 border border-pink-400/20">
                <h2 className="text-xl font-semibold text-white mb-3">
                  🛡️ Fully Private Matching
                </h2>
                <p className="text-white/80 mb-6 text-sm leading-relaxed">
                  Your data is encrypted before reaching the blockchain. Smart
                  contracts calculate compatibility scores on encrypted data to
                  find your perfect match.
                </p>
                <button
                  onClick={handleRegister}
                  disabled={!instance}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  Create Encrypted Profile
                </button>
                {!instance && (
                  <p className="text-yellow-400 text-xs mt-2">
                    ⏳ Loading encryption system...
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 rounded-lg p-3 border border-green-400/20">
                  <div className="text-xl mb-1">🔐</div>
                  <p className="text-green-300 font-medium text-xs">
                    Encrypted
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-blue-400/20">
                  <div className="text-xl mb-1">🧮</div>
                  <p className="text-blue-300 font-medium text-xs">
                    Smart Match
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-purple-400/20">
                  <div className="text-xl mb-1">🎯</div>
                  <p className="text-purple-300 font-medium text-xs">
                    Best Match
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-6 border border-green-400/30">
                <div className="text-3xl mb-2">🔐</div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  Profile Encrypted!
                </h2>
                <p className="text-white/80 mb-6 text-sm leading-relaxed">
                  Your profile is secured with FHE encryption. Ready to find
                  your perfect match through private compatibility calculations?
                </p>
                <button
                  onClick={handleSearchMatches}
                  disabled={isSearching || !instance}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isSearching ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      🧮 Finding Match...
                    </div>
                  ) : (
                    "✨ Find Perfect Match"
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate("/profile")}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 border border-white/10 text-sm"
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => navigate("/matches")}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 border border-white/10 text-sm"
                >
                  💕 Matches
                </button>
              </div>

              <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
                <p className="text-purple-200 text-xs">
                  🔒 <strong>Privacy Guaranteed:</strong> Matches calculated on
                  encrypted data. Personal information remains completely
                  private.
                </p>
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
