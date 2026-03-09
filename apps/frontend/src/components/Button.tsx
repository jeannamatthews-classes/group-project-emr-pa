import '../styles/Button.css';

/**
 * Reusable Button component with primary and secondary variants.
 * Supports disabled state for form validation.
 */
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  fullWidth?: boolean;
}

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn--${variant} ${fullWidth ? 'btn--full-width' : ''}`}
    >
      {children}
    </button>
  );
}

export default Button;
