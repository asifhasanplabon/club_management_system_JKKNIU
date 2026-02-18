// Loading Spinner Component
import React from "react";

export default function LoadingSpinner({ size = "md", fullScreen = false }) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const spinner = (
    <div className="flex items-center justify-center">
      <div
        className={`${sizes[size]} border-4 border-green-200 border-t-green-600 rounded-full animate-spin`}
      ></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className={`${sizes[size]} border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4`}></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return spinner;
}
