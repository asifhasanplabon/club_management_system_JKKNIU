// Empty State Component
import React from "react";
import { FiInbox } from "react-icons/fi";

export default function EmptyState({
  icon: Icon = FiInbox,
  title = "No data found",
  description,
  action,
  actionLabel,
}) {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {action && actionLabel && (
        <div className="mt-6">
          <button
            onClick={action}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
