import React from "react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold">Welcome to Oliviuus</h1>
      <p className="text-gray-600 mt-2">Please log in or sign up to continue</p>
      <div className="mt-4 flex gap-4">
        <a href="/auth" className="bg-[#BC8BBC] text-white px-4 py-2 rounded">
          Login
        </a>
        <a href="/auth" className="bg-gray-700 text-white px-4 py-2 rounded">
          Sign Up
        </a>
      </div>
    </div>
  );
}
