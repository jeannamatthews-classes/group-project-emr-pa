import '../styles/LoginCard.css';

/**
 * LoginCard - A reusable card container for the login form.
 * Provides the white rounded container with subtle shadow for the login UI.
 */
interface LoginCardProps {
  children: React.ReactNode;
}

function LoginCard({ children }: LoginCardProps) {
  return <div className="login-card">{children}</div>;
}

export default LoginCard;
