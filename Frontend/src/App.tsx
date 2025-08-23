import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DatingPrompt } from "./components/DatingPrompt";
import { ConnectedLayout } from "./components/ConnectedLayout";
import { UnconnectedLayout } from "./components/UnconnectedLayout";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { MatchesPage } from "./pages/MatchesPage";
import { useAccount, useChainId } from "wagmi";
import { FHEProvider } from "./contexts/FHEProvider";

function AppContent() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const isAuthenticated: boolean = isConnected && chainId === 11155111;

  if (!isAuthenticated) {
    return (
      <UnconnectedLayout>
        <DatingPrompt />
      </UnconnectedLayout>
    );
  }

  return (
    <ConnectedLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/matches" element={<MatchesPage />} />
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </ConnectedLayout>
  );
}

function App() {
  return (
    <FHEProvider>
      <Router>
        <AppContent />
      </Router>
    </FHEProvider>
  );
}

export default App;
