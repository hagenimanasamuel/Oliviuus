import React from "react";
import { FiEdit2 } from "react-icons/fi";

const EditableEmail = ({ email, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-300 hover:border-purple-500 hover:text-white cursor-pointer transition-all duration-200 group"
    >
      <span className="font-medium">{email}</span>
      <FiEdit2 className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-200" />
    </div>
  );
};

export default EditableEmail;