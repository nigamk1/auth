import React from 'react';
import { Layout } from '../ui/Layout';
import { AITeachingEngine } from '../ai/AITeachingEngine';

export const AITeachingEnginePage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Teaching Engine Demo
          </h1>
          <p className="text-gray-600">
            Experience the Day 9 AI Teaching Engine with intelligent prompts, 
            session memory, and multi-level difficulty adaptation.
          </p>
        </div>
        
        <AITeachingEngine />
      </div>
    </Layout>
  );
};

export default AITeachingEnginePage;
