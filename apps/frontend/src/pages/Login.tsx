import { useState } from "react";
import InputField from "../components/InputField";
import Button from "../frontend/src/components/Button";
import LoginCard from "../components/LoginCard";
import "../styles/Login.css";

const CLARKSON_EMAIL_SUFFIX = "@clarkson.edu";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email.endsWith(CLARKSON_EMAIL_SUFFIX)) {
      alert("Use your Clarkson email.");
      return;
    }

    console.log("Login:", email, password);
  };

  return (
    <div className="login-page">
      <LoginCard>
        <div className="header">
          <div className="icon">❤</div>

          <h3 className="university">CLARKSON UNIVERSITY</h3>
          <h1>Clarkson PA Educational EMR</h1>

          <p className="subtitle">Secure Student Access</p>
        </div>

        <InputField
          label="Clarkson Email"
          placeholder="yourname@clarkson.edu"
          value={email}
          onChange={setEmail}
        />

        <InputField
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
        />

        <div className="ssl">🔒 Protected by 256-bit SSL encryption</div>

        <Button onClick={handleLogin}>Sign In</Button>

        <p className="help">Need help accessing your account?</p>

        <div className="footer">
          For educational use only • Clarkson University PA Program
        </div>
      </LoginCard>
    </div>
  );
}

export default Login;