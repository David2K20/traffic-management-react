import React, { forwardRef } from 'react';

const FormInput = forwardRef(({ 
  label, 
  error,
  type = 'text',
  className = '',
  required = false,
  ...props 
}, ref) => {
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200';
  const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';
  const classes = `${baseClasses} ${errorClasses} ${className}`;
  
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea 
          ref={ref}
          className={classes}
          required={required}
          {...props}
        />
      ) : type === 'select' ? (
        <select 
          ref={ref}
          className={classes}
          required={required}
          {...props}
        >
          {props.children}
        </select>
      ) : (
        <input 
          ref={ref}
          type={type}
          className={classes}
          required={required}
          {...props}
        />
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
