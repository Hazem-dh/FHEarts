import { WalletButton } from "./components/walletButton";
import { DatingPrompt } from "./components/DatingPrompt";
import { AppInterface } from "./components/AppInterface";
import { useAccount, useChainId } from "wagmi";

function App() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <div className="min-h-screen max-h-screen overflow-hidden">
      {/* Logo in top left */}
      <WalletButton />

      <div className="fixed inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        <main className="h-screen flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full flex justify-center items-center min-h-full py-8">
            {isConnected && chainId === 11155111 ? (
              <AppInterface />
            ) : (
              <DatingPrompt />
            )}{" "}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
