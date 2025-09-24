import React from "react";

const SubscriptionCard = ({ plan, onSelect, loading }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-300">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">{plan.title}</h2>
        <p className="text-gray-400 mb-4">{plan.description}</p>
        <p className="text-2xl font-semibold text-[#BC8BBC]">{plan.price}</p>
      </div>
      <button
        onClick={onSelect}
        disabled={loading}
        className="mt-6 w-full bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-semibold py-2 rounded-lg transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? "..." : "Select"}
      </button>
    </div>
  );
};

export default SubscriptionCard;
