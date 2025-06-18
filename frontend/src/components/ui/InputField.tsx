import React from 'react';
import type { InputFieldProps } from '../../types';

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  error,
  register,
  className = '',
  ...props
}) => {
  const inputClasses = [
    'input',
    error ? 'input-error' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        className={inputClasses}
        {...register(name)}
        {...props}
      />
      {error && (
        <p className="error-text">{error}</p>
      )}
    </div>
  );
};

export default InputField;
