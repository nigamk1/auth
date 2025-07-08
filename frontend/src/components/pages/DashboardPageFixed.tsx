import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "../ui/Layout";
import { AcademicCapIcon, PlusIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      title: "Start AI Teaching Session",
      description: "Create a new interactive learning session with your AI teacher",
      icon: AcademicCapIcon,
      href: "/ai-teacher",
      bgColor: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      title: "Create New Session",
      description: "Start a new learning session on any topic",
      icon: PlusIcon,
      href: "/ai-teacher?action=create",
      bgColor: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      title: "View Analytics",
      description: "See your learning progress and session history",
      icon: ChartBarIcon,
      href: "/ai-teacher?tab=analytics",
      bgColor: "bg-purple-500",
      textColor: "text-purple-600"
    },
    {
      title: "Settings",
      description: "Customize your learning experience and preferences",
      icon: Cog6ToothIcon,
      href: "/settings",
      bgColor: "bg-gray-500",
      textColor: "text-gray-600"
    }
  ];

  return (
    <Layout title="AI Teacher Platform">
      {/* Welcome Section */}
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden shadow rounded-lg mb-8">
          <div className="px-6 py-8 sm:p-10">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Welcome back, {user?.firstName}!
                </h1>
                <p className="mt-2 text-xl text-blue-100">
                  Ready to learn with your AI teacher?
                </p>
                <p className="mt-1 text-blue-200">
                  Choose an action below to get started with interactive learning.
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user?.isEmailVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user?.isEmailVerified
                    ? "✓ Verified Account"
                    : "⚠ Please verify email"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 group"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-12 h-12 ${action.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className={`text-lg font-medium ${action.textColor} group-hover:text-opacity-80`}>
                      {action.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Getting Started</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Welcome to AI Teacher Platform</p>
                  <p className="text-sm text-gray-500">Start by creating your first learning session or exploring our interactive features.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Interactive Whiteboard</p>
                  <p className="text-sm text-gray-500">Use our collaborative whiteboard to visualize concepts and take notes during sessions.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Voice Interaction</p>
                  <p className="text-sm text-gray-500">Speak naturally with your AI teacher using voice commands and get audio responses.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
