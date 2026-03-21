
import React from 'react';

interface LoadingSpinnerProps {
  statusMessage: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ statusMessage }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm animate-fade-in">
      <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-8 h-8 bg-indigo-50 rounded-full"></div>
          </div>
      </div>
      <h3 className="mt-8 text-lg font-bold text-slate-800">{statusMessage}</h3>
      <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">Vui lòng không đóng cửa sổ trong lúc hệ thống đang làm việc.</p>
    </div>
  );
};

export default LoadingSpinner;
