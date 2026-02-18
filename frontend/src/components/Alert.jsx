// Alert/Toast Component
import React, { useEffect } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

export default function Alert({
  type = "info",
  message,
  onClose,
  autoClose = false,
  autoCloseDuration = 5000,
}) {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, onClose]);

  const types = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: FiCheckCircle,
      iconColor: "text-green-400",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: FiAlertCircle,
      iconColor: "text-red-400",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: FiAlertCircle,
      iconColor: "text-yellow-400",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: FiInfo,
      iconColor: "text-blue-400",
    },
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-lg p-4 mb-4 animate-fade-in`}
    >
      <div className="flex items-start">
        <Icon className={`${config.iconColor} w-5 h-5 mt-0.5 mr-3 flex-shrink-0`} />
        <div className="flex-1">
          <p className={`text-sm ${config.text}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${config.text} hover:opacity-75 ml-3`}
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
