// Reusable PageHeader Component
import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiHome } from "react-icons/fi";

export default function PageHeader({
  title,
  subtitle,
  showBack = true,
  showHome = true,
  actions,
  breadcrumbs,
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-2 text-sm mb-2">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="text-gray-400">/</span>}
                {crumb.path ? (
                  <button
                    onClick={() => navigate(crumb.path)}
                    className="text-gray-600 hover:text-green-600"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Navigation Buttons */}
            <div className="flex items-center space-x-2">
              {showBack && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  title="Go back"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
              )}
              {showHome && (
                <button
                  onClick={() => navigate("/")}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  title="Go to homepage"
                >
                  <FiHome className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Title and Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
