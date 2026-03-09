import { useState } from 'react';
import InputField from '../components/InputField';
import Button from '../components/Button';
import LoginCard from '../components/LoginCard';
import '../styles/Login.css';

/** Clarkson.edu email domain - used for validation */
const CLARKSON_EMAIL_SUFFIX = '@clarkson.edu';

/**
 * Login page for Clarkson PA Educational EMR.
 * Validates Clarkson email and password before submission.
 * handleLogin is prepared for future backend integration.
 */
function Login() {
  // Controlled form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  /**
   * Validates that email ends with @clarkson.edu
   */
  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!value.toLowerCase().endsWith(CLARKSON_EMAIL_SUFFIX)) {
      setEmailError('Please use your Clarkson University email');
      return false;
    }
    setEmailError('');
    return true;
  };

  /**
   * Validates that password is not empty
   */
  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    setPasswordError('');
    return true;
  };

  /**
   * Handles form submission.
   * Currently logs credentials to console - ready for backend API integration.
   */
  const handleLogin = () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    // Log form values - replace with API call when backend is ready
    console.log('Login attempt:', {
      email: email.trim(),
      passwordLength: password.length,
    });
  };

  /**
   * Handle form submit event (e.g. Enter key)
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="login-page">
      <div className="login-page__container">
        <LoginCard>
          {/* Header section */}
          <header className="login-page__header">
            <h1 className="login-page__title">Clarkson Educational EMR</h1>
          </header>

          {/* Login form */}
          <form className="login-page__form" onSubmit={handleSubmit}>
            <InputField
              type="email"
              id="clarkson-email"
              value={email}
              onChange={(value) => {
                setEmail(value);
                if (emailError) validateEmail(value);
              }}
              placeholder="yourname@clarkson.edu"
              error={emailError}
              autoComplete="email"
            />

            <InputField
              type="password"
              id="password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (passwordError) validatePassword(value);
              }}
              placeholder="Password"
              error={passwordError}
              autoComplete="current-password"
            />

            <Button type="submit" fullWidth>
              Sign In
            </Button>
          </form>

          {/* Help links */}
          <div className="login-page__links">
            <a href="#" className="login-page__link">
              Forgot password?
            </a>
            <a href="#" className="login-page__link">
              Need help accessing your account?
            </a>
          </div>
          
        </LoginCard>
      </div>
    </div>
  );
}

export default Login;
