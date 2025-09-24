import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const ProfileMenu = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const menuRef = useRef();

  // Fetch user profile (from backend via token)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me"); // backend should return { email }
        if (res.data?.email) setEmail(res.data.email);
      } catch (err) {
        console.error("❌ Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout"); // backend clears cookie
      navigate("/auth", { replace: true });
    } catch (err) {
      console.error("❌ Logout failed:", err);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition"
      >
        <span className="text-sm">{email ? email.charAt(0).toUpperCase() : "U"}</span>
        <ChevronDown size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
            {email || "Loading..."}
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
