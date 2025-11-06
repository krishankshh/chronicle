/**
 * Reusable Input component with validation states
 */
import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  type = 'text',
  required = false,
  ...props
}, ref) => {
  const baseStyles = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors';
  const normalStyles = 'border-gray-300 focus:border-blue-500 focus:ring-blue-200';
  const errorStyles = 'border-red-500 focus:border-red-500 focus:ring-red-200';

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`${baseStyles} ${error ? errorStyles : normalStyles} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
