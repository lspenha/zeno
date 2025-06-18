"use client"
export interface ButtonProps {
  primary?: boolean;
  backgroundColor?: string;
  size?: 'small' | 'medium' | 'large';
  label: string;
  onClick?: () => void;
}

export const Button = ({
  primary = false,
  size = 'medium',
  backgroundColor,
  label,
  ...props
}: ButtonProps) => {
  const baseClasses = `inline-block cursor-pointer border-0 rounded-full font-bold leading-none font-sans`;

  const sizeClasses = {
    small: 'px-4 py-2 text-xs',
    medium: 'px-5 py-2.5 text-sm',
    large: 'px-6 py-3 text-base',
  }[size];

  const variantClasses = primary
    ? 'bg-indigo-600 text-white'
    : 'bg-transparent text-gray-800 shadow-inner';

  const customBackground = backgroundColor ? backgroundColor : '';

  return (
    <button
      type="button"
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${customBackground}`}
      {...props}
    >
      {label}
    </button>
  );
};
