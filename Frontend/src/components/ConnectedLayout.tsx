import React from "react";
import { Navbar } from "./Navbar";

export function ConnectedLayout({ children }: { children: React.ReactNode }) {
  return (
    < div className="min-h-screen max-h-screen overflow-hidden relative">
              <Navbar />
      
      <div className="fixed inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        <main className="h-full flex items-center justify-center p-4 overflow-y-auto pt-16">
          <div className="w-full flex justify-center items-center min-h-full py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}