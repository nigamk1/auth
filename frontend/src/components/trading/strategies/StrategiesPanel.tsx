import React, { useState } from 'react';
import tradingAPI from '../../../services/trading/tradingAPI';
import type { StrategyInfo } from '../../../types/trading';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface StrategiesPanelProps {
  strategies: StrategyInfo[];
}

const StrategiesPanel: React.FC<StrategiesPanelProps> = ({ strategies }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});

  // Handle strategy selection
  const handleStrategySelect = (strategyName: string) => {
    setSelectedStrategy(strategyName);
    const strategy = strategies.find(s => s.name === strategyName);
    if (strategy) {
      setParameters(strategy.parameters || {});
    }
    setError(null);
    setSuccess(null);
  };

  // Handle parameter change
  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prevParams => ({
      ...prevParams,
      [paramName]: value
    }));
  };

  // Handle toggle strategy enabled/disabled
  const handleToggleEnabled = async (strategyName: string, isEnabled: boolean) => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);

      const strategy = strategies.find(s => s.name === strategyName);
      if (!strategy) {
        throw new Error('Strategy not found');
      }

      await tradingAPI.updateStrategy(strategyName, {
        isEnabled,
        parameters: strategy.parameters
      });

      setSuccess(`Strategy ${strategyName} ${isEnabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      setError(`Failed to update strategy: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle save parameters
  const handleSaveParameters = async () => {
    if (!selectedStrategy) return;

    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);

      const strategy = strategies.find(s => s.name === selectedStrategy);
      if (!strategy) {
        throw new Error('Strategy not found');
      }

      await tradingAPI.updateStrategy(selectedStrategy, {
        isEnabled: strategy.isEnabled,
        parameters
      });

      setSuccess(`Parameters for ${selectedStrategy} updated successfully`);
    } catch (err) {
      setError(`Failed to update parameters: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset parameters to defaults
  const handleResetParameters = (strategyName: string) => {
    const strategy = strategies.find(s => s.name === strategyName);
    if (strategy && strategy.defaultParameters) {
      setParameters({...strategy.defaultParameters});
      setSuccess(`Parameters reset to defaults for ${strategyName}`);
    }
  };

  if (strategies.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-gray-500">No trading strategies available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Trading Strategies</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Configure and activate algorithmic trading strategies
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Strategy List */}
        <div className="md:col-span-4 border-r border-gray-200 p-4">
          <div className="space-y-2">
            {strategies.map((strategy) => (
              <div
                key={strategy.name}
                className={`p-3 rounded-md cursor-pointer transition ${
                  selectedStrategy === strategy.name
                    ? 'bg-indigo-100 border-l-4 border-indigo-600'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleStrategySelect(strategy.name)}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">{strategy.name}</h4>
                  <div className="relative inline-block">
                    <button
                      disabled={isUpdating}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleEnabled(strategy.name, !strategy.isEnabled);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none ${
                        isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <span
                        className={`${
                          strategy.isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                        } inline-block h-5 w-10 rounded-full transition-colors`}
                      />
                      <span
                        className={`${
                          strategy.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        } inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ml-0.5`}
                      />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {strategy.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Details */}
        <div className="md:col-span-8 p-4">
          {selectedStrategy ? (
            <div>
              {error && (
                <div className="mb-4 bg-red-50 p-4 rounded-md border border-red-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-50 p-4 rounded-md border border-green-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {(() => {
                const strategy = strategies.find(s => s.name === selectedStrategy);
                if (!strategy) return null;

                return (
                  <>
                    <h3 className="text-lg font-medium text-gray-900">{strategy.name}</h3>
                    <p className="mt-2 text-sm text-gray-500">{strategy.description}</p>

                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900">Parameters</h4>
                      <div className="mt-2 space-y-4">
                        {Object.entries(parameters).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-3 gap-4 items-center">
                            <label htmlFor={key} className="block text-sm font-medium text-gray-700 col-span-1">
                              {key}:
                            </label>
                            <div className="col-span-2">
                              {typeof value === 'boolean' ? (
                                <input
                                  type="checkbox"
                                  id={key}
                                  checked={value}
                                  onChange={(e) => handleParameterChange(key, e.target.checked)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                              ) : typeof value === 'number' ? (
                                <input
                                  type="number"
                                  id={key}
                                  value={value}
                                  onChange={(e) => handleParameterChange(key, parseFloat(e.target.value))}
                                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                              ) : (
                                <input
                                  type="text"
                                  id={key}
                                  value={value}
                                  onChange={(e) => handleParameterChange(key, e.target.value)}
                                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => handleResetParameters(strategy.name)}
                        className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Reset to Defaults
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveParameters}
                        disabled={isUpdating}
                        className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {isUpdating ? 
                          <span className="flex items-center">
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Saving...</span>
                          </span> 
                          : 'Save Parameters'
                        }
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-600">
                Select a strategy to view and edit its parameters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategiesPanel;
