// src/pages/account/tabs/ParentalControls.jsx
import React, { useState } from "react";

export default function ParentalControls() {
  const [pin, setPin] = useState("");
  const [enabled, setEnabled] = useState(false);

  const handleSave = () => {
    // Call API to save parental PIN
    alert("Parental controls updated!");
  };

  return (
    <div className="space-y-4 max-w-md">
      <label className="text-gray-400 block">Enable Parental Controls</label>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
        className="mr-2"
      />
      {enabled && (
        <div>
          <label className="text-gray-400 block">Set 4-digit PIN</label>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-24 px-3 py-1 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BC8BBC]"
          />
        </div>
      )}
      <button
        onClick={handleSave}
        className="px-6 py-2 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-medium rounded-lg transition"
      >
        Save
      </button>
    </div>
  );
}
