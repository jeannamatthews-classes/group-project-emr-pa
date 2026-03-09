import { useState } from 'react';
import '../styles/InputField.css';

/**
 * Reusable InputField component for form inputs.
 * Supports text and password types with optional show/hide toggle for passwords.
 */
interface InputFieldProps {
  type: 'text' | 'password' | 'email';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  id?: string;
  autoComplete?: string;
}

function InputField({
  type,
  value,
  onChange,
  placeholder = '',
  label,
  error,
  id,
  autoComplete,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Determine input type: for password, toggle between 'password' and 'text'
  const inputType = type === 'password' && showPassword ? 'text' : type;

  const isPassword = type === 'password';

  return (
    <div className="input-field">
      {label && (
        <label htmlFor={id} className="input-field__label">
          {label}
        </label>
      )}
      <div className={`input-field__wrapper ${isPassword ? 'input-field__wrapper--password' : ''}`}>
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`input-field__input ${error ? 'input-field__input--error' : ''}`}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {/* Show/hide toggle for password fields */}
        {type === 'password' && (
          <button
            type="button"
            className="input-field__toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <span className="input-field__toggle-icon" aria-hidden="true">
                Hide
              </span>
            ) : (
              <span className="input-field__toggle-icon" aria-hidden="true">
                Show
              </span>
            )}
          </button>
        )}
      </div>
      {error && (
        <span id={error ? `${id}-error` : undefined} className="input-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export default InputField;
