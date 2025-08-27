import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicClient, useAccount } from "wagmi";
import { contract_address } from "../contract/addresses";
import { ABI } from "../contract/ABI";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Match {
  id: number;
  address: string;
}

export function MatchesPage() {
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

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
      console.error("Error checking registration status:", error);
      return false;
    }
  };

  const fetchPendingMatches = async (): Promise<string[]> => {
    try {
      if (!publicClient || !address) {
        return [];
      }

      const result = await publicClient.readContract({
        address: contract_address,
        abi: ABI,
        functionName: "hasPendingMatches",
        args: [address],
      });
      return result as string[];
    } catch (error) {
      console.error("Error fetching pending matches:", error);
      return [];
    }
  };

  useEffect(() => {
    const initializePage = async (): Promise<void> => {
      setIsLoading(true);
      try {
        if (!address) {
          setIsRegistered(false);
          setIsLoading(false);
          return;
        }

        // Check registration status
        const registered = await checkRegistrationStatus();
        setIsRegistered(registered);

        if (registered) {
          // Fetch pending matches
          const pendingAddresses = await fetchPendingMatches();

          // Create simple match objects with just addresses
          const matchObjects = pendingAddresses.map((addr, index) => ({
            id: index + 1,
            address: addr,
          }));
          setMatches(matchObjects);
        }
      } catch (error) {
        console.error("Error initializing matches page:", error);
        toast.error("Failed to load matches");
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [address, publicClient]);

  const handleGoToRegister = (): void => {
    navigate("/");
  };

  // Show loading state
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

  // Show not registered state
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
                📝 Go to Registration
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
          {/* Header */}
          <div className="p-8 text-center border-b border-white/20">
            <h1 className="text-3xl font-bold text-white mb-2">
              💕 My Matches
            </h1>
            <p className="text-white/70">
              {matches.length > 0
                ? `${matches.length} people are interested in you!`
                : "Connect with people who liked you back"}
            </p>
          </div>

          {/* Matches List */}
          <div className="p-6">
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💔</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No pending matches
                </h3>
                <p className="text-white/70 mb-6">
                  No one has matched with you yet. Keep your profile active!
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
                >
                  🔍 Find More Matches
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-white/10 rounded-xl p-6 hover:bg-white/15 transition-all duration-200 cursor-pointer border border-white/20"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                        👤
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {match.address}
                        </h3>
                        <p className="text-white/60 text-sm">Wallet Address</p>
                      </div>

                      <div className="text-right">
                        <div className="text-green-400 text-xs mb-1">
                          💚 Interested
                        </div>
                        <div className="text-white/70 text-sm">
                          Pending Match
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Match Details Modal */}
          {selectedMatch && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                    👤
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Pending Match
                  </h2>
                  <div className="bg-white/10 rounded-lg p-4 mb-4">
                    <p className="text-white/80 text-sm mb-1">
                      Wallet Address:
                    </p>
                    <p className="text-white font-mono text-sm break-all">
                      {selectedMatch.address}
                    </p>
                  </div>
                  <p className="text-white/60 text-sm">
                    This user has shown interest in your profile
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => toast.info("Messaging feature coming soon!")}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                  >
                    💬 Send Message
                  </button>
                  <button
                    onClick={() =>
                      toast.info("Profile viewing feature coming soon!")
                    }
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                  >
                    👀 View Full Profile
                  </button>
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="w-full bg-white/20 text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/30 transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
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
