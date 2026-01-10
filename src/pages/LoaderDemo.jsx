import React from 'react';
import Loader from '../components/common/Loader';

const LoaderDemo = () => {
  return (
    <div className="pb-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Loader Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spinner Loader */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 text-lg mb-4">Spinner Loader</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <Loader type="spinner" size="lg" />
            <p className="mt-3 text-gray-600 text-sm">Default spinner loader</p>
          </div>
        </div>
        
        {/* Pulse Loader */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 text-lg mb-4">Pulse Loader</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <Loader type="pulse" size="lg" />
            <p className="mt-3 text-gray-600 text-sm">Pulsing dots animation</p>
          </div>
        </div>
        
        {/* Cross Loader */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 text-lg mb-4">Cross Loader</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <Loader type="cross" size="lg" />
            <p className="mt-3 text-gray-600 text-sm">Pharmacy-themed cross loader</p>
          </div>
        </div>
        
        {/* Wave Loader */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 text-lg mb-4">Wave Loader</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <Loader type="wave" size="lg" />
            <p className="mt-3 text-gray-600 text-sm">Wave animation</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 text-lg mb-4">Different Sizes</h3>
        <div className="flex flex-wrap items-center justify-center gap-8 py-4">
          <div className="flex flex-col items-center">
            <Loader type="spinner" size="sm" />
            <p className="mt-2 text-gray-600 text-xs">Small</p>
          </div>
          <div className="flex flex-col items-center">
            <Loader type="spinner" size="md" />
            <p className="mt-2 text-gray-600 text-xs">Medium</p>
          </div>
          <div className="flex flex-col items-center">
            <Loader type="spinner" size="lg" />
            <p className="mt-2 text-gray-600 text-xs">Large</p>
          </div>
          <div className="flex flex-col items-center">
            <Loader type="spinner" size="xl" />
            <p className="mt-2 text-gray-600 text-xs">Extra Large</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 text-lg mb-4">With Messages</h3>
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-4">
            <Loader type="pulse" size="lg" message="Loading patient data..." />
          </div>
          <div className="flex flex-col items-center justify-center py-4">
            <Loader type="wave" size="md" message="Processing prescription..." />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoaderDemo;