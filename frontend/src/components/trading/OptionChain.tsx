import React, { useState, useEffect } from 'react';
import { useTradingSocket } from '../../contexts/trading/TradingSocketContext';
import tradingAPI from '../../services/trading/tradingAPI';
import type { OptionData } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface OptionChainProps {
  strikeCount?: number;
}

const OptionChain: React.FC<OptionChainProps> = ({ strikeCount = 10 }) => {
  const { niftyData } = useTradingSocket();
  const [optionChain, setOptionChain] = useState<OptionData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [expiryDates, setExpiryDates] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  // Load option chain data
  useEffect(() => {
    const fetchOptionChain = async () => {
      try {
        setIsLoading(true);
        const data = await tradingAPI.getOptionChain({
          expiry: selectedExpiry || undefined
        });
        
        setOptionChain(data.options);          // Get unique expiry dates if not already set
          if (expiryDates.length === 0 && data.options.length > 0) {
            const uniqueExpiryDates = [...new Set(data.options.map((option: OptionData) => option.expiryDate))];
            setExpiryDates(uniqueExpiryDates.sort() as string[]);
            
            if (!selectedExpiry && uniqueExpiryDates.length > 0) {
              setSelectedExpiry(uniqueExpiryDates[0] as string);
            }
          }
      } catch (err: any) {
        console.error('Error fetching option chain:', err);
        setError('Failed to load option chain data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptionChain();
  }, [selectedExpiry]);

  // Calculate strike range based on current Nifty price
  const getStrikeRange = () => {
    if (!niftyData || !niftyData.price || optionChain.length === 0) return [];
    
    const currentPrice = niftyData.price;
    const roundedPrice = Math.round(currentPrice / 50) * 50; // Round to nearest 50
    
    const filteredOptions = optionChain.filter(option => 
      option.expiryDate === selectedExpiry
    );

    if (filteredOptions.length === 0) return [];

    // Get unique strike prices
    const strikes = [...new Set(filteredOptions.map(option => option.strikePrice))].sort((a, b) => a - b);
    
    if (strikes.length === 0) return [];
    
    // Find index of ATM strike (closest to current price)
    const atmIndex = strikes.findIndex(strike => strike >= roundedPrice);
    const actualAtmIndex = atmIndex >= 0 ? atmIndex : Math.floor(strikes.length / 2);
    
    // Get strikes around ATM
    const halfCount = Math.floor(strikeCount / 2);
    const startIndex = Math.max(0, actualAtmIndex - halfCount);
    const endIndex = Math.min(strikes.length - 1, actualAtmIndex + halfCount);
    
    return strikes.slice(startIndex, endIndex + 1);
  };

  // Group options by strike price
  const getOptionsByStrike = () => {
    const strikes = getStrikeRange();
    const result: { strike: number, ce?: OptionData, pe?: OptionData }[] = [];
    
    strikes.forEach(strike => {
      const ceOption = optionChain.find(opt => 
        opt.strikePrice === strike && 
        opt.optionType === 'CE' && 
        opt.expiryDate === selectedExpiry
      );
      
      const peOption = optionChain.find(opt => 
        opt.strikePrice === strike && 
        opt.optionType === 'PE' && 
        opt.expiryDate === selectedExpiry
      );
      
      result.push({ strike, ce: ceOption, pe: peOption });
    });
    
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (optionChain.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Option Chain
        </h2>
        <p className="text-gray-600 mb-4">
          No option chain data available at the moment. This could be due to market hours or data availability.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Refresh Data
        </button>
      </div>
    );
  }

  const optionsByStrike = getOptionsByStrike();
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          Option Chain {niftyData ? `(NIFTY: ${niftyData.price.toFixed(2)})` : ''}
        </h2>
        
        <div className="ml-4">
          <select
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={selectedExpiry}
            onChange={(e) => setSelectedExpiry(e.target.value)}
          >
            {expiryDates.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('en-US', { 
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th colSpan={5} className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center border-r">
                CALLS
              </th>
              <th rowSpan={2} className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center bg-gray-100">
                Strike
              </th>
              <th colSpan={5} className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center border-l">
                PUTS
              </th>
            </tr>
            <tr className="bg-gray-50">
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                OI
              </th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                Chg
              </th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                IV
              </th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                Bid
              </th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                Ask
              </th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                Bid
              </th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                Ask
              </th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                IV
              </th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                Chg
              </th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                OI
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {optionsByStrike.map(({ strike, ce, pe }) => {
              const isATM = niftyData && Math.abs(niftyData.price - strike) < 50;
              
              return (
                <tr 
                  key={strike} 
                  className={isATM ? 'bg-blue-50' : undefined}
                >
                  {/* CALLS */}
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                    {ce ? ce.openInterest.toLocaleString() : '-'}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-sm text-right ${ce ? (ce.change >= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                    {ce?.openInterestChange ? `${ce.openInterestChange > 0 ? '+' : ''}${ce.openInterestChange.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                    {ce ? `${ce.impliedVolatility.toFixed(2)}%` : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium">
                    {ce ? ce.bidPrice.toFixed(2) : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium">
                    {ce ? ce.askPrice.toFixed(2) : '-'}
                  </td>
                  
                  {/* STRIKE */}
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center font-bold bg-gray-100">
                    {strike.toFixed(2)}
                  </td>
                  
                  {/* PUTS */}
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium">
                    {pe ? pe.bidPrice.toFixed(2) : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium">
                    {pe ? pe.askPrice.toFixed(2) : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                    {pe ? `${pe.impliedVolatility.toFixed(2)}%` : '-'}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-sm text-right ${pe ? (pe.change >= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                    {pe?.openInterestChange ? `${pe.openInterestChange > 0 ? '+' : ''}${pe.openInterestChange.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                    {pe ? pe.openInterest.toLocaleString() : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500">
        <p>* OI = Open Interest, IV = Implied Volatility</p>
      </div>
    </div>
  );
};

export default OptionChain;
