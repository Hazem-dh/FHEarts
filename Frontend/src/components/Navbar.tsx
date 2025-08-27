import { Link, useLocation } from "react-router-dom";
import { WalletButton } from "./walletButton";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export function Navbar() {
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/profile", label: "Profile", icon: "👤" },
    { path: "/matches", label: "Matches", icon: "💕" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Left: Logo/Brand */}
          <div className="flex items-center flex-shrink-0">
            <span className="text-2xl font-bold text-white">💖 FHEarts</span>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex-1 flex justify-center">
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                    location.pathname === item.path
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Wallet Button */}
          <div className="flex items-center flex-shrink-0">
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white/5 border-t border-white/10">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center gap-2 ${
                location.pathname === item.path
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
