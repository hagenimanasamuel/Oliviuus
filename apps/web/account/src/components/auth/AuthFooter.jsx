import React from "react";

const AuthFooter = () => {
  return (
    <footer className="bg-[#0a0a0a] border-t border-gray-900 px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          {/* Links */}
          <div className="flex flex-wrap gap-6 text-sm text-gray-400">
            <a 
              href="https://oliviuus.com/privacy" 
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="https://oliviuus.com/terms" 
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </a>
            <a 
              href="https://oliviuus.com/help" 
              className="hover:text-white transition-colors"
            >
              Help Center
            </a>
            <a 
              href="https://oliviuus.com/contact" 
              className="hover:text-white transition-colors"
            >
              Contact Us
            </a>
          </div>

          {/* Copyright */}
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Oliviuus, Inc.
          </div>
        </div>

        {/* Language Selector (Simple) */}
        <div className="mt-6 pt-6 border-t border-gray-900">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-400 text-sm">English (United States)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;