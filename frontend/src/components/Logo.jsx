import React from "react";
import logo from "../assets/oliviuus_logo_transparent.png";

const Logo = () => {
  return (
    <div className="flex items-center justify-center">
      <img
        src={logo}
        alt="Oliviuus Logo"
        className="w-15 h15 object-contain"
      />
    </div>
  );
};

export default Logo;
