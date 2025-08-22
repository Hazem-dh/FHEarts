// MatchesPage.tsx
import React, { useState } from "react";

interface Match {
  id: number;
  name: string;
  age: number;
  bio: string;
  avatar: string;
  matchDate: string;
  lastMessage: string;
}

export function MatchesPage() {
  // Mock matches data
  const [matches] = useState<Match[]>([
    {
      id: 1,
      name: "Alice",
      age: 25,
      bio: "Love hiking and photography 📸",
      avatar: "👩‍🦰",
      matchDate: "2024-01-15",
      lastMessage: "Hey! How's your day going?",
    },
    {
      id: 2,
      name: "Sarah",
      age: 28,
      bio: "Coffee enthusiast ☕ & book lover 📚",
      avatar: "👩‍🦱",
      matchDate: "2024-01-14",
      lastMessage: "Would love to grab coffee sometime!",
    },
    {
      id: 3,
      name: "Emma",
      age: 26,
      bio: "Yoga instructor & traveler 🧘‍♀️✈️",
      avatar: "👩‍🦳",
      matchDate: "2024-01-13",
      lastMessage: "Thanks for the match! 😊",
    },
  ]);

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-8 text-center border-b border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2">💕 My Matches</h1>
          <p className="text-white/70">
            Connect with people who liked you back
          </p>
        </div>

        {/* Matches List */}
        <div className="p-6">
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💔</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No matches yet
              </h3>
              <p className="text-white/70">
                Keep swiping to find your perfect match!
              </p>
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
                      {match.avatar}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          {match.name}
                        </h3>
                        <span className="text-white/70 text-sm">
                          {match.age}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm mb-2">{match.bio}</p>
                      <p className="text-white/60 text-xs">
                        Last message: {match.lastMessage}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-white/50 text-xs mb-1">Matched</div>
                      <div className="text-white/70 text-sm">
                        {formatDate(match.matchDate)}
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
                  {selectedMatch.avatar}
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedMatch.name}, {selectedMatch.age}
                </h2>
                <p className="text-white/80 mt-2">{selectedMatch.bio}</p>
              </div>

              <div className="space-y-4">
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200">
                  💬 Send Message
                </button>
                <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200">
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
  );
}
