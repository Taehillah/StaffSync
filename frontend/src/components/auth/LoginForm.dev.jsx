import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { useAuth } from "../../stores/authStore";

export default function LoginFormDev() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const devLogin = async () => {
    await login("demo@staffsync.local", "password123");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Login smoke test</h2>
      <p>If you can see this, the /auth/login route renders fine.</p>
      <Button onClick={devLogin}>Dev Login</Button>
    </div>
  );
}
