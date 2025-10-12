import React from "react";

export default function Overview({ user }) {
  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">
          Overview: <span className="text-[#BC8BBC]">{user?.email}</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Role: <span className="font-medium">Admin</span>
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "Users", desc: "Manage viewers and other admins." },
          { title: "Library", desc: "Approve content and organize the library." },
          { title: "Subscriptions", desc: "Monitor plans, payments, and refunds." },
          { title: "Analytics", desc: "Track usage, revenue, and trends." },
          { title: "Global Management", desc: "Platform settings, integrations, and roles." },
          { title: "Support", desc: "Handle user and admin tickets." },
        ].map((card) => (
          <div key={card.title} className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
            <p className="text-gray-300">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Welcome / Info Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Welcome, Admin!</h2>
        <p className="text-gray-300">
          Use the sidebar to navigate between system modules. Each section gives you full control over the platform features.
        </p>
      </div>
    </div>
  );
}
