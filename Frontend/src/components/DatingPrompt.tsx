export function DatingPrompt() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-12">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-pink-100 to-red-100 bg-clip-text text-transparent">
          SecretSwipe
        </h1>

        <p className="text-xl md:text-2xl text-pink-100 mb-8 font-light">
          Private Dating with FHE
        </p>

        <div className="text-gray-300 space-y-4 mb-12">
          <p className="text-lg">🔒 Your preferences stay fully encrypted</p>
          <p className="text-lg">💘 Matches only reveal if both swipe right</p>
          <p className="text-lg">
            📱 Phone numbers stay hidden until you allow reveal
          </p>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❤️</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Create Your Profile
          </h3>
          <p className="text-pink-100">
            Register securely and start searching for private matches
          </p>
        </div>
      </div>
    </div>
  );
}
