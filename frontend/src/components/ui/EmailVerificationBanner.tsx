import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { verificationAPI } from "../../services/api";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { useToast } from "../../contexts/ToastContext";

const EmailVerificationBanner: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { updateEmailVerificationStatus } = useAuth();

  const sendVerificationEmail = async () => {
    if (!user || user.isEmailVerified) return;
    
    try {
      setIsLoading(true);
      setError("");
      await verificationAPI.sendVerificationEmail();
      await updateEmailVerificationStatus();
      showToast("Verification email sent! Please check your inbox.", "success");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send verification email");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user || user.isEmailVerified) {
    return null;
  }
  
  return (
    <div className="w-full bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <p className="text-sm text-amber-700">
            Your email is not verified. Please verify your email to access all features.
          </p>
          <p className="mt-3 text-sm md:mt-0 md:ml-6">
            <Button
              onClick={sendVerificationEmail}
              loading={isLoading}
              disabled={isLoading}
              className="whitespace-nowrap bg-amber-100 text-amber-800 hover:bg-amber-200"
            >
              {isLoading ? "Sending..." : "Send verification email"}
            </Button>
          </p>
        </div>
      </div>
      {error && (
        <div className="mt-3">
          <Alert
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        </div>
      )}
    </div>
  );
};

export default EmailVerificationBanner;
