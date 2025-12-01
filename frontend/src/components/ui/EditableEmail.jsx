import React from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2 } from "react-icons/fi";

const EditableEmail = ({ email }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Redirect to email step page
    navigate("/auth");
    window.location.reload(); // reset AuthForm state
  };

  return (
    <span
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-3 py-2 border-2 border-gray-600 rounded-lg text-gray-400 hover:border-[#BC8BBC] hover:text-white cursor-pointer transition-all duration-200"
      title="Edit email"
    >
      {email}
      <FiEdit2 className="w-5 h-5 text-gray-400 hover:text-white transition-colors duration-200" />
    </span>
  );
};

export default EditableEmail;
