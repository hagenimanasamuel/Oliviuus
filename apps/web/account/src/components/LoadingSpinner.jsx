// src/components/LoadingSpinner.jsx
import './LoadingSpinner.css';
import "./Loading.css"

export default function LoadingSpinner() {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading your Oliviuus account...</p>
      </div>
    </div>
  );
}