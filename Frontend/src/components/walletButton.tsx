import { useEffect, useState } from "react";
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useEnsName, 
  useChainId, 
  useChains,
  useSwitchChain 
} from "wagmi";

export const  WalletButton=()=> {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const chainId = useChainId();
  const chains = useChains();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [isReady, setIsReady] = useState(false);
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const connector = connectors[0]; // Use first connector (e.g., MetaMask)

  // Get current chain info
  const currentChain = chains.find(chain => chain.id === chainId);
  
  // Only Ethereum Mainnet and Sepolia
  const availableChains = chains.filter(chain => 
    [1, 11155111].includes(chain.id) // Mainnet, Sepolia
  );

  useEffect(() => {
    if (!connector) return;

    const check = async () => {
      const provider = await connector.getProvider();
      setIsReady(!!provider);
    };

    check();
  }, [connector]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element)?.closest('.network-dropdown')) {
        setShowNetworkMenu(false);
      }
    };

    if (showNetworkMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showNetworkMenu]);

  const handleNetworkSwitch = async (targetChainId:number) => {
    try {
      await switchChain({ chainId: targetChainId });
      setShowNetworkMenu(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
      // You might want to show a toast notification here
    }
  };

  const isWrongNetwork = chainId !== 11155111; // Check if not on Sepolia

  if (!connector) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      {!isConnected ? (
        <button
          onClick={() => connect({ connector })}
          disabled={!isReady || isPending}
          className={`px-5 py-2 rounded-lg font-semibold text-white transition-all duration-300
            ${
              isPending
                ? "opacity-50 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:shadow-lg hover:brightness-110"
            }
          `}
        >
          {isPending ? "Connecting..." : `Connect Wallet`}
        </button>
      ) : (
        <>
          <div className="flex flex-col items-end gap-1 text-white font-medium hidden sm:block">
            <div className="text-sm">
              {ensName
                ? `${ensName} (${address?.slice(0, 4)}...${address?.slice(-4)})`
                : `${address?.slice(0, 6)}...${address?.slice(-4)}`}
            </div>
            
            {/* Network switcher */}
            <div className="relative network-dropdown">
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-all duration-200 ${
                  isWrongNetwork 
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                    : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                }`}
              >
                <div 
                  className={`w-2 h-2 rounded-full ${
                    isWrongNetwork ? 'bg-red-400' : 'bg-green-400'
                  }`}
                  title={isWrongNetwork ? "Wrong Network" : "Connected"}
                ></div>
                {currentChain?.name || `Chain ${chainId}`}
                <span className="text-xs">▼</span>
              </button>

              {showNetworkMenu && (
                <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg min-w-[180px] overflow-hidden">
                  {availableChains.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => handleNetworkSwitch(chain.id)}
                      disabled={isSwitching}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-700 flex items-center gap-2 ${
                        chain.id === chainId ? 'bg-gray-700 text-green-300' : 'text-white'
                      } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          chain.id === chainId ? 'bg-green-400' : 'bg-gray-400'
                        }`}
                      ></div>
                      {chain.name}
                      {chain.id === 11155111 && (
                        <span className="text-xs text-blue-300 ml-auto">Testnet</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile view */}
          <div className="flex flex-col items-end gap-1 text-white font-medium sm:hidden">
            <div className="text-sm">
              {address?.slice(0, 4)}...{address?.slice(-4)}
            </div>
            <div className="relative network-dropdown">
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-all duration-200 ${
                  isWrongNetwork 
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                    : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                }`}
              >
                <div 
                  className={`w-2 h-2 rounded-full ${
                    isWrongNetwork ? 'bg-red-400' : 'bg-green-400'
                  }`}
                ></div>
                {currentChain?.name || `Chain ${chainId}`}
                <span className="text-xs">▼</span>
              </button>

              {showNetworkMenu && (
                <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg min-w-[160px] overflow-hidden">
                  {availableChains.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => handleNetworkSwitch(chain.id)}
                      disabled={isSwitching}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-700 flex items-center gap-2 ${
                        chain.id === chainId ? 'bg-gray-700 text-green-300' : 'text-white'
                      } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          chain.id === chainId ? 'bg-green-400' : 'bg-gray-400'
                        }`}
                      ></div>
                      {chain.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Sepolia switch button for wrong network */}
          {isWrongNetwork && (
            <button
              onClick={() => handleNetworkSwitch(11155111)}
              disabled={isSwitching}
              className="px-3 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 hover:shadow-lg hover:brightness-110 disabled:opacity-50"
            >
              {isSwitching ? "Switching..." : "Switch to Sepolia"}
            </button>
          )}

          <button
            onClick={() => disconnect()}
            className="px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transition-all duration-300 hover:shadow-xl hover:brightness-110"
          >
            Disconnect
          </button>
        </>
      )}
    </div>
  );
}