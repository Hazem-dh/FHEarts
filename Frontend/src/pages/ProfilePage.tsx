// ProfilePage.tsx
import React, { useState, type ChangeEvent } from "react";

interface ProfileData {
  phoneNumber: string;
  age: string;
  location: string;
  preference1: string[]; // Sports preferences
  preference2: string[]; // Movie preferences
  preference3: string; // Personality type
}

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    phoneNumber: "",
    age: "",
    location: "",
    preference1: [], // Sports preferences
    preference2: [], // Movie preferences
    preference3: "", // Personality type
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Options for preferences
  const sportOptions: string[] = [
    "Football",
    "Basketball",
    "Tennis",
    "Swimming",
    "Running",
    "Cycling",
    "Yoga",
    "Gym",
    "Soccer",
    "Baseball",
    "Golf",
    "Hiking",
  ];

  const movieOptions: string[] = [
    "Action",
    "Comedy",
    "Drama",
    "Horror",
    "Romance",
    "Sci-Fi",
    "Thriller",
    "Documentary",
    "Animation",
    "Fantasy",
    "Mystery",
    "Adventure",
  ];

  const personalityOptions: string[] = ["Introvert", "Extrovert", "Ambivert"];

  const locationOptions: string[] = [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
    "Austin",
    "Jacksonville",
  ];

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiSelect = (
    category: keyof Pick<ProfileData, "preference1" | "preference2">,
    option: string
  ): void => {
    setProfile((prev) => {
      const current = prev[category] || [];
      if (current.includes(option)) {
        return {
          ...prev,
          [category]: current.filter((item) => item !== option),
        };
      } else if (current.length < 3) {
        return {
          ...prev,
          [category]: [...current, option],
        };
      }
      return prev;
    });
  };

  const handleSave = async (): Promise<void> => {
    try {
      // TODO: Integrate with your smart contract
      // This would involve encrypting the data and calling registerUser
      console.log("Saving profile:", profile);

      // Example of how you might structure the call:
      // await contract.registerUser(
      //   encryptedPhoneNumber,
      //   encryptedAge,
      //   encryptedLocation,
      //   encryptedPreference1,
      //   encryptedPreference2,
      //   encryptedPreference3,
      //   inputProof
      // );

      setIsEditing(false);
      alert("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-white/70">
            Manage your dating profile (encrypted on-chain)
          </p>
        </div>

        <div className="space-y-6">
          {/* Phone Number */}
          <div>
            <label className="block text-white font-medium mb-2">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phoneNumber"
                value={profile.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                placeholder="Enter your phone number"
              />
            ) : (
              <div className="px-4 py-3 bg-white/10 rounded-lg text-white">
                {profile.phoneNumber
                  ? "***-***-" + profile.phoneNumber.slice(-4)
                  : "Not set"}
              </div>
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block text-white font-medium mb-2">Age</label>
            {isEditing ? (
              <input
                type="number"
                name="age"
                min="18"
                max="100"
                value={profile.age}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                placeholder="Enter your age"
              />
            ) : (
              <div className="px-4 py-3 bg-white/10 rounded-lg text-white">
                {profile.age || "Not set"}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-white font-medium mb-2">
              Location
            </label>
            {isEditing ? (
              <select
                name="location"
                value={profile.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
              >
                <option value="" className="bg-gray-800">
                  Select your location
                </option>
                {locationOptions.map((location) => (
                  <option
                    key={location}
                    value={location}
                    className="bg-gray-800"
                  >
                    {location}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-4 py-3 bg-white/10 rounded-lg text-white">
                {profile.location || "Not set"}
              </div>
            )}
          </div>

          {/* Sports Preferences */}
          <div>
            <label className="block text-white font-medium mb-2">
              Sports Preferences (Select up to 3)
            </label>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                {sportOptions.map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => handleMultiSelect("preference1", sport)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      profile.preference1?.includes(sport)
                        ? "bg-pink-500 text-white"
                        : "bg-white/20 text-white/80 hover:bg-white/30"
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 bg-white/10 rounded-lg text-white">
                {profile.preference1?.length > 0
                  ? profile.preference1.join(", ")
                  : "Not set"}
              </div>
            )}
          </div>

          {/* Movie Preferences */}
          <div>
            <label className="block text-white font-medium mb-2">
              Movie Preferences (Select up to 3)
            </label>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                {movieOptions.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleMultiSelect("preference2", genre)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      profile.preference2?.includes(genre)
                        ? "bg-purple-500 text-white"
                        : "bg-white/20 text-white/80 hover:bg-white/30"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 bg-white/10 rounded-lg text-white">
                {profile.preference2?.length > 0
                  ? profile.preference2.join(", ")
                  : "Not set"}
              </div>
            )}
          </div>

          {/* Personality Type */}
          <div>
            <label className="block text-white font-medium mb-2">
              Personality Type
            </label>
            {isEditing ? (
              <div className="flex gap-2">
                {personalityOptions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setProfile((prev) => ({ ...prev, preference3: type }))
                    }
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      profile.preference3 === type
                        ? "bg-indigo-500 text-white"
                        : "bg-white/20 text-white/80 hover:bg-white/30"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 bg-white/10 rounded-lg text-white">
                {profile.preference3 || "Not set"}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                >
                  Save to Blockchain
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-white/20 text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/30 transition-all duration-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
