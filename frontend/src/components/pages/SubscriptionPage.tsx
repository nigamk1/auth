import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import {
  CheckIcon,
  XMarkIcon,
  StarIcon,
  CreditCardIcon,
  ChartBarIcon,
  GiftIcon
} from '@heroicons/react/24/outline';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: any;
  popular: boolean;
  buttonText: string;
}

interface Subscription {
  plan: string;
  status: string;
  currentPeriod: {
    start: Date;
    end: Date;
  };
  usage: {
    questions: {
      used: number;
      limit: number;
      percentage: number;
      unlimited: boolean;
    };
    videos: {
      used: number;
      limit: number;
      percentage: number;
      unlimited: boolean;
    };
  };
  features: {
    canShareVideos: boolean;
    canDownloadVideos: boolean;
    prioritySupport: boolean;
    maxVideoDuration: number;
  };
  monthProgress: {
    percentage: number;
    daysRemaining: number;
  };
}

const SubscriptionPage: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      
      // Load current subscription
      const subResponse = await fetch('/api/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setCurrentSubscription(subData.data);
      }

      // Load available plans
      const plansResponse = await fetch('/api/subscription/plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData.data);
      }

      // Load usage statistics
      const usageResponse = await fetch('/api/subscription/usage', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsageStats(usageData.data);
      }
      
    } catch (error) {
      console.error('Error loading subscription data:', error);
      showToast('Failed to load subscription data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === currentSubscription?.plan) {
      showToast('You are already on this plan', 'info');
      return;
    }

    setIsUpgrading(true);
    setSelectedPlan(planId);

    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: planId,
          paymentMethodId: 'pm_card_visa' // Simulated payment method
        })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');
        await loadSubscriptionData(); // Reload data
      } else {
        const error = await response.json();
        showToast(error.message, 'error');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      showToast('Failed to upgrade subscription', 'error');
    } finally {
      setIsUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'info');
        await loadSubscriptionData();
      } else {
        const error = await response.json();
        showToast(error.message, 'error');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      showToast('Failed to cancel subscription', 'error');
    }
  };

  const getUsagePercentage = (used: number, limit: number, unlimited: boolean) => {
    if (unlimited) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Subscription & Usage
        </h1>
        <p className="text-lg text-gray-600">
          Manage your AI Tutor subscription and track your usage
        </p>
      </div>

      {/* Current Usage Stats */}
      {usageStats && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
            Current Usage - {usageStats.plan.charAt(0).toUpperCase() + usageStats.plan.slice(1)} Plan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Questions Usage */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Questions This Month</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {usageStats.usage.questions.used}
                </span>
                <span className="text-sm text-gray-500">
                  / {usageStats.usage.questions.unlimited ? '∞' : usageStats.usage.questions.limit}
                </span>
              </div>
              {!usageStats.usage.questions.unlimited && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(usageStats.usage.questions.percentage)}`}
                    style={{ width: `${usageStats.usage.questions.percentage}%` }}
                  />
                </div>
              )}
            </div>

            {/* Videos Usage */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Videos This Month</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {usageStats.usage.videos.used}
                </span>
                <span className="text-sm text-gray-500">
                  / {usageStats.usage.videos.unlimited ? '∞' : usageStats.usage.videos.limit}
                </span>
              </div>
              {!usageStats.usage.videos.unlimited && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(usageStats.usage.videos.percentage)}`}
                    style={{ width: `${usageStats.usage.videos.percentage}%` }}
                  />
                </div>
              )}
            </div>

            {/* Days Remaining */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Billing Period</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {usageStats.monthProgress.daysRemaining}
                </span>
                <span className="text-sm text-gray-500">days left</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${usageStats.monthProgress.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Features */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-3">Current Plan Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center">
                {usageStats.features.canShareVideos ? (
                  <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <XMarkIcon className="h-4 w-4 text-red-500 mr-2" />
                )}
                Share Videos
              </div>
              <div className="flex items-center">
                {usageStats.features.canDownloadVideos ? (
                  <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <XMarkIcon className="h-4 w-4 text-red-500 mr-2" />
                )}
                Download Videos
              </div>
              <div className="flex items-center">
                {usageStats.features.prioritySupport ? (
                  <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <XMarkIcon className="h-4 w-4 text-red-500 mr-2" />
                )}
                Priority Support
              </div>
              <div className="flex items-center">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                {Math.floor(usageStats.features.maxVideoDuration / 60)}min Videos
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Choose Your Plan
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-md border-2 ${
                plan.popular 
                  ? 'border-blue-500 transform scale-105' 
                  : currentSubscription?.plan === plan.id
                  ? 'border-green-500'
                  : 'border-gray-200'
              } p-6`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 text-xs font-medium rounded-full flex items-center">
                    <StarIcon className="h-3 w-3 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}
              
              {currentSubscription?.plan === plan.id && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={
                  isUpgrading || 
                  currentSubscription?.plan === plan.id ||
                  (plan.id === 'enterprise')
                }
                className="w-full"
                variant={
                  currentSubscription?.plan === plan.id 
                    ? 'outline' 
                    : plan.popular 
                    ? 'primary' 
                    : 'outline'
                }
              >
                {isUpgrading && selectedPlan === plan.id ? (
                  <LoadingSpinner size="sm" />
                ) : currentSubscription?.plan === plan.id ? (
                  'Current Plan'
                ) : plan.id === 'enterprise' ? (
                  'Contact Sales'
                ) : (
                  plan.buttonText
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Information */}
      {currentSubscription && currentSubscription.plan !== 'free' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCardIcon className="h-6 w-6 mr-2 text-blue-600" />
            Billing Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Plan</h3>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {currentSubscription.plan}
              </p>
              <p className="text-sm text-gray-600">
                ${currentSubscription.billing?.amount || 0}/{currentSubscription.billing?.interval || 'month'}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Next Billing Date</h3>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                Auto-renewal {currentSubscription.status === 'cancelled' ? 'cancelled' : 'enabled'}
              </p>
            </div>
          </div>

          {currentSubscription.status !== 'cancelled' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Cancel Subscription
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Promo Section */}
      <div className="mt-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-6 text-white text-center">
        <GiftIcon className="h-12 w-12 mx-auto mb-4 text-white" />
        <h2 className="text-2xl font-bold mb-2">Need More Questions?</h2>
        <p className="mb-4 opacity-90">
          Upgrade to Premium and get 10x more questions plus video explanations!
        </p>
        {currentSubscription?.plan === 'free' && (
          <Button
            onClick={() => handleUpgrade('premium')}
            variant="outline"
            className="bg-white text-purple-600 border-white hover:bg-gray-100"
          >
            Upgrade Now
          </Button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
