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
      throw new Error("FHE instance not available");
    }

    if (!address) {
      throw new Error("Wallet not connected");
    }

    console.log("Starting registration with FHE instance:", instance);
    console.log("Registration data:", formData);
    toast.info("🔒 Encrypting your data with FHE... This may take a moment...");

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

    console.log("Encrypting data...");
    const ciphertexts = await buffer.encrypt();
    console.log("Ciphertexts generated:", ciphertexts);

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

    console.log("Transaction sent:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.blockNumber);
  };

  const handleRegistrationComplete = async (
    formData: RegistrationData
  ): Promise<void> => {
    setIsRegistering(true);

    try {
      await toast.promise(performRegistration(formData), {
        pending: "Registering your profile...",
        success: "Registration complete! 🎉",
        error: "Registration failed",
      });

      // Update state
      setIsRegistered(true);
      setShowRegistration(false);

      // Show additional success message
      setTimeout(() => {
        toast.success("You can now search for matches! 💕");
      }, 1000);
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegistrationBack = (): void => {
    if (isRegistering) {
      toast.warning("Registration in progress, please wait...");
      return;
    }
    setShowRegistration(false);
  };

  const performSearch = async (): Promise<void> => {
    if (!instance) {
      throw new Error("FHE instance not available");
    }

    if (!address) {
      throw new Error("Wallet not connected");
    }

    console.log("Searching for matches with FHE instance:", instance);
    toast.info("🔍 Initiating search for compatible matches...");

    try {
      // Prepare transaction using ethers
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contract_address, ABI, signer);

      console.log("Calling searchMatches function on contract...");

      // Call the searchMatches function on the smart contract
      // Adjust the function name based on your actual contract function
      const tx = await contract.searchMatches();

      console.log("Search transaction sent:", tx.hash);
      toast.info("⛓️ Transaction submitted to blockchain...");

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log("Search transaction confirmed:", receipt.blockNumber);
      console.log(
        "Search completed successfully - results stored in contract variables"
      );
    } catch (error) {
      console.error("Error executing search transaction:", error);
      throw error;
    }
  };

  const handleSearchMatches = async (): Promise<void> => {
    setIsSearching(true);

    try {
      await toast.promise(performSearch(), {
        pending: "Searching for matches...",
        success: "Matches found! ✨",
        error: "Search failed",
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
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {instanceLoading
                ? "Initializing FHE..."
                : "Checking Registration Status..."}
            </h2>
            <p className="text-white/70">
              {instanceLoading
                ? "Loading encryption system"
                : "Fetching data from blockchain"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if FHE instance failed to load
  if (instanceError) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-red-400/30">
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Encryption System Error
            </h2>
            <p className="text-white/70 mb-4">
              Failed to initialize FHE system: {instanceError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">💖</div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome to FHEarts
            </h1>
            <p className="text-white/70 text-lg">
              Decentralized dating powered by blockchain
            </p>
          </div>

          {!isRegistered ? (
            <div className="text-center space-y-6">
              <div className="bg-white/5 rounded-lg p-6 border border-white/20">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Get Started
                </h2>
                <p className="text-white/80 mb-6">
                  You need to register your profile on the blockchain to start
                  finding matches. Your data will be encrypted and securely
                  stored.
                </p>
                <button
                  onClick={handleRegister}
                  disabled={!instance}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 px-8 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📝 Register Profile
                </button>
                {!instance && (
                  <p className="text-yellow-400 text-sm mt-2">
                    Waiting for encryption system to load...
                  </p>
                )}
              </div>

              <div className="text-white/60 text-sm">
                <p>✅ Encrypted data storage</p>
                <p>✅ Decentralized matching</p>
                <p>✅ Privacy-first approach</p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="bg-green-500/20 rounded-lg p-6 border border-green-400/30">
                <div className="text-4xl mb-2">✅</div>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Profile Registered!
                </h2>
                <p className="text-white/80 mb-6">
                  Your profile is registered on the blockchain. Ready to find
                  your perfect match?
                </p>
                <button
                  onClick={handleSearchMatches}
                  disabled={isSearching || !instance}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 px-8 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Searching for Matches...
                    </div>
                  ) : (
                    "🔍 Search for Matches"
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/profile")}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                >
                  👤 Edit Profile
                </button>
                <button
                  onClick={() => navigate("/matches")}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                >
                  💕 View Matches
                </button>
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
