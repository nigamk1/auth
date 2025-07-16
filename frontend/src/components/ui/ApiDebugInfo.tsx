import React from 'react';

export const ApiDebugInfo: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const finalBaseUrl = apiUrl ? `${apiUrl}/api` : 'http://localhost:5000/api';

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded text-xs opacity-75">
      <div>API Base: {finalBaseUrl}</div>
      <div>Mode: {import.meta.env.MODE}</div>
    </div>
  );
};
