type Props = {
  children: React.ReactNode;
};

function LoginCard({ children }: Props) {
  return <div className="login-card">{children}</div>;
}

export default LoginCard;