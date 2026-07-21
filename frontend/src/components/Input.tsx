import React, { useState } from "react";
import { LucideIcon, Eye, EyeOff, X } from "lucide-react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconClick?: () => void;
  showPasswordToggle?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconClick,
  showPasswordToggle,
  type = 'text',
  size = 'md',
  fullWidth = true,
  className = '',
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password') 
    : type;

  const sizeStyles = {
    sm: 'min-h-[36px] text-sm',
    md: 'min-h-[44px] text-base',
    lg: 'min-h-[52px] text-lg',
  };

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const leftPadding = LeftIcon ? 'pl-11' : 'pl-3';
  const rightPadding = (RightIcon || showPasswordToggle) ? 'pr-11' : 'pr-3';

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
            <LeftIcon size={iconSize[size]} />
          </div>
        )}

        <input
          id={id}
          type={inputType}
          className={`
            w-full
            ${leftPadding}
            ${rightPadding}
            ${sizeStyles[size]}
            bg-[var(--bg-tertiary)]
            border border-[var(--border-color)]
            rounded-lg
            text-[var(--text-primary)]
            placeholder:text-[var(--text-muted)]
            transition-all duration-150
            focus:outline-none
            focus:border-[var(--accent-blue)]
            focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]
            disabled:opacity-50
            disabled:cursor-not-allowed
            ${error ? 'border-[var(--accent-red)] focus:border-[var(--accent-red)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''}
            ${isFocused ? 'border-[var(--accent-blue)]' : ''}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {(RightIcon || showPasswordToggle) && (
          <button
            type="button"
            onClick={showPasswordToggle ? () => setShowPassword(!showPassword) : onRightIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center"
            tabIndex={-1}
          >
            {showPasswordToggle ? (
              showPassword ? (
                <EyeOff size={iconSize[size]} />
              ) : (
                <Eye size={iconSize[size]} />
              )
            ) : RightIcon ? (
              <RightIcon size={iconSize[size]} />
            ) : null}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-[var(--accent-red)] flex items-center gap-1.5">
          <X size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
