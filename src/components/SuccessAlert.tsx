// components/SuccessAlert.tsx
import React from 'react';

interface SuccessAlertProps {
  title: string;
  message: string;
  onClose: () => void;
  type?: 'success' | 'info' | 'warning';
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ 
  title, 
  message, 
  onClose, 
  type = 'success' 
}) => {
  const bgColor = {
    success: 'bg-green-50 border-green-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  }[type];

  const textColor = {
    success: 'text-green-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800'
  }[type];

  const iconColor = {
    success: 'text-green-400',
    info: 'text-blue-400',
    warning: 'text-yellow-400'
  }[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${bgColor} border rounded-lg p-6 max-w-md w-full mx-4`}>
        <div className="flex items-center gap-3">
          <div className={`${iconColor}`}>
            {type === 'success' && (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {type === 'info' && (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${textColor}`}>{title}</h3>
            <p className={`mt-1 text-sm ${textColor}`}>{message}</p>
          </div>
          <button
            onClick={onClose}
            className={`${textColor} hover:opacity-70`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <button
          onClick={onClose}
          className={`mt-4 w-full py-2 px-4 ${type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessAlert;