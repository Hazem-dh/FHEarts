import React from "react";
//import { useState } from "react";

export const AppInterface = () => {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
        Welcome to SecretSwipe
      </h1>
      <p className="text-lg md:text-xl text-gray-300 mb-8">
        Your private dating experience starts here
      </p>
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
        <p className="text-gray-200 mb-4">
          Connect with others while keeping your preferences secure and private.
        </p>
        <button className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full transition-colors">
          Start Now
        </button>
      </div>
      <div className="mt-12 text-gray-400">
        <p className="text-sm">© 2025 SecretSwipe. All rights reserved.</p>
      </div>
    </div>
  );
};
