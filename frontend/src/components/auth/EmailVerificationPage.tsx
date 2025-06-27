import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { verificationAPI } from "../../services/api";

const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string>("");
  const { user } = useAuth();

  // Verify token on page load
  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
      setError("Verification token is missing");
    }
  }, [token]);

  const { updateEmailVerificationStatus } = useAuth();

  const verifyToken = async (token: string) => {
    try {
      setIsLoading(true);
      await verificationAPI.verifyEmail(token);
      setIsVerified(true);
      // Update user in context to reflect verified status
      await updateEmailVerificationStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || "Email verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    try {
      setIsLoading(true);
      await verificationAPI.resendVerification();
      setError("");
      alert("Verification email sent successfully. Please check your inbox.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send verification email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Email Verification
          </h2>
        </div>

        {/* Verification Card */}
        <div className="bg-white shadow-xl rounded-2xl px-8 py-10 border border-gray-100">
          {isLoading ? (
            <div className="text-center py-6">
              <svg
                className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          ) : isVerified ? (
            <div>
              <div className="text-center mb-6">
                <svg
                  className="h-16 w-16 text-green-500 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-4 text-xl font-medium text-gray-900">
                  Email Verified Successfully!
                </h3>
                <p className="mt-2 text-gray-600">
                  Your email has been verified. You can now access all features of the platform.
                </p>
              </div>
              <div className="mt-6">
                <Link to="/dashboard">
                  <Button
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {error && (
                <Alert
                  type="error"
                  message={error}
                  onClose={() => setError("")}
                />
              )}
              <div className="text-center mb-6">
                <svg
                  className="h-16 w-16 text-yellow-500 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h3 className="mt-4 text-xl font-medium text-gray-900">
                  Verification Failed
                </h3>
                <p className="mt-2 text-gray-600">
                  We couldn't verify your email with the provided token. The token might be invalid or expired.
                </p>
              </div>

              {user && !user.isEmailVerified && (
                <div className="mt-6">
                  <Button
                    onClick={resendVerification}
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    Resend Verification Email
                  </Button>
                </div>
              )}

              <div className="mt-4 text-center">
                <Link
                  to="/dashboard"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
