import React, { useState, useEffect } from "react";
import Header from "./Header.jsx";

export default function ViewerLayout({ children, user, onLogout }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted)
    return (
      <div className="flex h-screen bg-gray-900 text-gray-300">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-300 overflow-hidden">
      <Header user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto pt-16">
        {children}
      </main>
    </div>
  );
}