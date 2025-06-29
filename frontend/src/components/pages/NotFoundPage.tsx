import React from "react";
import { Link } from "react-router-dom";
import Button from "../ui/Button";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-32 w-32 text-gray-400 mb-4">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Page not found
          </h2>
          <p className="text-gray-500 mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <div className="space-x-4">
            <Link to="/dashboard">
              <Button variant="primary">Go to Dashboard</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline">Go to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
