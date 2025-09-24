import React from "react";

export default function FamilyProfiles({ user }) {
  // Placeholder data
  const profiles = [
    { name: "Main", avatar: "" },
    { name: "Kid 1", avatar: "" },
  ];

  return (
    <div className="space-y-4 max-w-md">
      <p className="text-gray-400">Manage Profiles</p>
      <ul className="space-y-2">
        {profiles.map((p, idx) => (
          <li key={idx} className="flex items-center gap-3">
            <img
              src={
                p.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${p.name}`
              }
              alt={p.name}
              className="w-12 h-12 rounded-full border border-gray-700 object-cover"
            />
            <span className="text-white">{p.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
