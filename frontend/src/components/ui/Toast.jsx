import React, { useEffect } from "react";

const Toast = ({ message, type = "info", onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeStyles = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-500",
    info: "bg-blue-600",
  };

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg ${typeStyles[type]}`}>
      {message}
    </div>
  );
};

export default Toast;
