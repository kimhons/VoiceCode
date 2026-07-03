import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  const getButtonClass = () => {
    const baseClass = 'px-4 py-2 rounded font-medium transition-colors';
    const variantClass = {
      primary: 'bg-blue-500 hover:bg-blue-600 text-white',
      secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
      danger: 'bg-red-500 hover:bg-red-600 text-white',
    };
    
    return `${baseClass} ${variantClass[variant]} ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    }`;
  };

  return (
    <button
      className={getButtonClass()}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

