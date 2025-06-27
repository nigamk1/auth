import React, { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuth } from "../../contexts/AuthContext";
import { updateProfileSchema } from "../../utils/validation";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import LoadingSpinner from "../ui/LoadingSpinner";
import type { UpdateProfileRequest } from "../../types";
import tradingAPI from "../../services/trading/tradingAPI";

type ActiveTab = "profile" | "trading";

export const UserProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [alertConfig, setAlertConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateProfileRequest>({
    resolver: yupResolver(updateProfileSchema) as unknown as Resolver<UpdateProfileRequest>,
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio || "",
        dateOfBirth: user.dateOfBirth || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UpdateProfileRequest) => {
    try {
      setIsLoading(true);
      setError("");
      setMessage("");

      await updateProfile(data);
      setMessage("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const handleAlertClose = () => {
    setAlertConfig(null);
  };

  const handleSaveTradingPreferences = async (data: any) => {
    setLoadingConfig(true);
    try {
      // Call your API to save trading preferences here
      await tradingAPI.savePreferences(data);
      setAlertConfig({
        type: "success",
        message: "Trading preferences updated successfully!",
      });
    } catch (error: any) {
      setAlertConfig({
        type: "error",
        message: error.message || "Failed to update trading preferences",
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg mb-4">
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Profile Information
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Update your personal details and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => handleTabChange("profile")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "profile"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => handleTabChange("trading")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "trading"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Trading Preferences
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "profile" ? (
        /* Profile Form */
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
          <div className="px-8 py-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert
                  type="error"
                  message={error}
                  onClose={() => setError("")}
                />
              )}
              {message && (
                <Alert
                  type="success"
                  message={message}
                  onClose={() => setMessage("")}
                />
              )}

              <div className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        {...register("firstName")}
                        type="text"
                        autoComplete="given-name"
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors ${
                          errors.firstName
                            ? "border-red-300 text-red-900"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter your first name"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Last Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        {...register("lastName")}
                        type="text"
                        autoComplete="family-name"
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors ${
                          errors.lastName
                            ? "border-red-300 text-red-900"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter your last name"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Field (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                    </div>
                    <div className="flex items-center justify-between pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-900">{user.email}</span>
                      {user.isEmailVerified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⚠ Not Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio Field */}
                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Bio
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h7"
                        />
                      </svg>
                    </div>
                    <textarea
                      id="bio"
                      rows={4}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors resize-none ${
                        errors.bio
                          ? "border-red-300 text-red-900"
                          : "border-gray-300"
                      }`}
                      placeholder="Tell us about yourself..."
                      {...register("bio")}
                    />
                  </div>
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.bio.message}
                    </p>
                  )}
                </div>

                {/* Date and Phone Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="dateOfBirth"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Date of Birth
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <input
                        {...register("dateOfBirth")}
                        type="date"
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors ${
                          errors.dateOfBirth
                            ? "border-red-300 text-red-900"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.dateOfBirth.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <input
                        {...register("phoneNumber")}
                        type="tel"
                        autoComplete="tel"
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors ${
                          errors.phoneNumber
                            ? "border-red-300 text-red-900"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={isLoading}
                    disabled={isLoading}
                    className="w-full sm:w-auto flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Update Profile
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Trading Preferences Form */
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
          <div className="px-8 py-10">
            {alertConfig && (
              <Alert
                type={alertConfig.type}
                message={alertConfig.message}
                onClose={handleAlertClose}
              />
            )}
            <form
              onSubmit={handleSubmit(handleSaveTradingPreferences)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-6">
                {/* Trading Pair Preferences */}
                <div>
                  <label
                    htmlFor="tradingPairs"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Preferred Trading Pairs
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h7"
                        />
                      </svg>
                    </div>
                    <input
                      {...register("tradingPairs")}
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                      placeholder="BTC, ETH, LTC"
                    />
                  </div>
                </div>

                {/* Order Type Preferences */}
                <div>
                  <label
                    htmlFor="orderTypes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Default Order Types
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h7"
                        />
                      </svg>
                    </div>
                    <select
                      {...register("orderTypes")}
                      className="block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    >
                      <option value="">Select order types</option>
                      <option value="market">Market Order</option>
                      <option value="limit">Limit Order</option>
                      <option value="stop-limit">Stop-Limit Order</option>
                    </select>
                  </div>
                </div>

                {/* Leverage Preferences */}
                <div>
                  <label
                    htmlFor="leverage"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Default Leverage
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h7"
                        />
                      </svg>
                    </div>
                    <input
                      {...register("leverage")}
                      type="number"
                      className="block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                      placeholder="Enter default leverage"
                    />
                  </div>
                </div>

                {/* Price Alert Preferences */}
                <div>
                  <label
                    htmlFor="priceAlerts"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Price Alert Thresholds
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h7"
                        />
                      </svg>
                    </div>
                    <input
                      {...register("priceAlerts")}
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                      placeholder="BTC:50000, ETH:4000"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={loadingConfig}
                    disabled={loadingConfig}
                    className="w-full sm:w-auto flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Preferences
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
