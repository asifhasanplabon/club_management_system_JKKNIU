// Card Component
import React from "react";

export default function Card({
  children,
  className = "",
  padding = true,
  hover = false,
  onClick,
}) {
  const baseStyles = "bg-white rounded-lg shadow border border-gray-200";
  const hoverStyles = hover
    ? "hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer"
    : "";
  const paddingStyles = padding ? "p-6" : "";

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${paddingStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
