import React from "react";

const AuthHeader = () => {
  return (
    <header className="w-full px-6 py-4 border-b border-gray-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">O</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">Oliviuus</span>
        </div>

        {/* Help Link */}
        <a
          href="https://support.oliviuus.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          Help
        </a>
      </div>
    </header>
  );
};

export default AuthHeader;