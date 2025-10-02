import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'light';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    light: 'text-white'
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'light';
  fullScreen?: boolean;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'lg',
  variant = 'primary',
  fullScreen = false,
  className = ''
}) => {
  const containerClass = fullScreen
    ? 'fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50'
    : 'flex items-center justify-center py-12';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className="text-center">
        <LoadingSpinner size={size} variant={variant} className="mx-auto mb-3" />
        <p className={`text-sm font-medium ${
          variant === 'light' ? 'text-white' : 'text-gray-600'
        }`}>
          {message}
        </p>
      </div>
    </div>
  );
};

interface DotsLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'light';
  className?: string;
}

const DotsLoading: React.FC<DotsLoadingProps> = ({
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const variantClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    light: 'bg-white'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

interface PulseLoadingProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'light';
}

const PulseLoading: React.FC<PulseLoadingProps> = ({
  className = '',
  variant = 'primary'
}) => {
  const variantClasses = {
    primary: 'bg-blue-100',
    secondary: 'bg-gray-100',
    light: 'bg-white bg-opacity-20'
  };

  return (
    <div className={`animate-pulse ${className}`}>
      <div className={`h-4 ${variantClasses[variant]} rounded mb-2`}></div>
      <div className={`h-4 ${variantClasses[variant]} rounded w-3/4 mb-2`}></div>
      <div className={`h-4 ${variantClasses[variant]} rounded w-1/2`}></div>
    </div>
  );
};

export { LoadingSpinner, LoadingState, DotsLoading, PulseLoading };
export default LoadingSpinner;