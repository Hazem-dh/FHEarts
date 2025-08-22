import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contract_address } from "../contract/addresses";
import { ABI } from "../contract/ABI";
import { usePublicClient, useAccount } from "wagmi";
import { RegistrationFlow } from "../components/RegistrationFlow";

interface RegistrationData {
  leadingZeros: number; // euint8 - Count of leading zeros
  countryCode: number; // euint8 - Country code as number
  phoneDigits: number; // euint64 - Phone digits without leading zeros
  age: number;
  location: number; // City/region code
  gender: number; // 0 for male, 1 for female, 2 for non-binary, 3 for other
  interestedIn: number; // 0 for male, 1 for female, 2 for non-binary, 3 for other
  preference1: number; // Movie type (0-4)
  preference2: number; // Activity (0-4)
  preference3: number; // Personality type (0-2)
}
export function HomePage() {
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showRegistration, setShowRegistration] = useState<boolean>(false);
  const navigate = useNavigate();
  const publicClient = usePublicClient();
  const { address } = useAccount();

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
      console.error("Error calling isUserRegistered:", error);
      return false;
    }
  };

  useEffect(() => {
    const fetchStatus = async (): Promise<void> => {
      setIsLoading(true);
      try {
        // Mock delay to simulate blockchain call for better UX
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const status = await checkRegistrationStatus();
        setIsRegistered(status);
      } catch (error) {
        console.error("Error checking registration status:", error);
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

  const handleRegistrationComplete = async (
    formData: RegistrationData
  ): Promise<void> => {
    try {
      // TODO: Replace with actual smart contract call
      // Example: await registerUserOnBlockchain(formData);
      console.log("Registration completed with data:", formData);

      // Simulate successful registration
      setIsRegistered(true);
      setShowRegistration(false);

      // Show success message
      alert("Registration successful! Welcome to LoveChain!");
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    }
  };

  const handleRegistrationBack = (): void => {
    setShowRegistration(false);
  };

  const handleSearchMatches = async (): Promise<void> => {
    setIsSearching(true);
    try {
      // TODO: Replace with actual smart contract transaction
      // await contract.searchForMatches();

      // Mock delay to simulate blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("Search completed! Check your matches.");
      navigate("/matches");
    } catch (error) {
      console.error("Error searching for matches:", error);
      alert("Error searching for matches. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Show registration flow if user clicked register
  if (showRegistration) {
    return (
      <RegistrationFlow
        onComplete={
          handleRegistrationComplete as (
            data: RegistrationData
          ) => void | Promise<void>
        }
        onBack={handleRegistrationBack}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Checking Registration Status...
            </h2>
            <p className="text-white/70">Fetching data from blockchain</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💖</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to LoveChain
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
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 px-8 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 text-lg"
              >
                📝 Register Profile
              </button>
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
                Your profile is registered on the blockchain. Ready to find your
                perfect match?
              </p>
              <button
                onClick={handleSearchMatches}
                disabled={isSearching}
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
  );
}
