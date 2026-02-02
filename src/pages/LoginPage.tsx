import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../components/Button";
import Input from "../components/Input";
import { loginSchema, type LoginFormData } from "../schemas/loginSchema";
import { useNavigate } from "react-router-dom";
import {
  showSuccessNotification,
  showErrorNotification,
} from "../utils/notifications";
import { useState, useEffect } from "react";
import "../styles/auth.scss";

export function LoginPage() {
  const [apiUrl, setApiUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const methods = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
      return;
    }

    window.electronAPI.getServerPort().then((port) => {
      setApiUrl(`http://localhost:${port}`);
    });
  }, [navigate]);

  const onSubmit = async (formData: LoginFormData) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.data));

        if (formData.rememberMe) {
          localStorage.setItem("rememberMe", "true");
        }

        showSuccessNotification("Login successful!");
        navigate("/dashboard");
      } else {
        showErrorNotification(data.error || "Login failed");
      }
    } catch (err) {
      const error = err as Error;
      showErrorNotification(
        error?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-sidebar">
          <div className="sidebar-content">
            <h2>Welcome Back!</h2>
            <p>Access your dashboard</p>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-form-wrapper">
            <div className="auth-header">
              <h1>Welcome</h1>
              <p>Please login to Admin Dashboard.</p>
            </div>

            <FormProvider {...methods}>
              <form
                onSubmit={methods.handleSubmit(onSubmit)}
                className="auth-form"
              >
                <Input
                  name="email"
                  type="email"
                  placeholder="someone@example.com"
                  label="Email"
                />

                <Input
                  name="password"
                  type="password"
                  placeholder="@P@ssword123"
                  label="Password"
                />

                <div className="form-footer">
                  <label className="remember-me">
                    <input
                      type="checkbox"
                      {...methods.register("rememberMe")}
                    />
                    <label>Remember me</label>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="link-button"
                  >
                    Need an account?
                  </button>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Login"}
                </Button>
              </form>
            </FormProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
