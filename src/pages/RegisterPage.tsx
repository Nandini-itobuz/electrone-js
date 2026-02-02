import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../components/Button";
import Input from "../components/Input";
import {
  registerSchema,
  type RegisterFormData,
} from "../schemas/registerSchema";
import { useNavigate } from "react-router-dom";
import {
  showSuccessNotification,
  showErrorNotification,
} from "../utils/notifications";
import { useState, useEffect } from "react";

export function RegisterPage() {
  const [apiUrl, setApiUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const methods = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });
  const navigate = useNavigate();

  useEffect(() => {
    window.electronAPI.getServerPort().then((port) => {
      setApiUrl(`http://localhost:${port}`);
    });
  }, []);

  const onSubmit = async (formData: RegisterFormData) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccessNotification("Registration successful! Please login.");
        navigate("/login");
      } else {
        showErrorNotification(data.error || "Registration failed");
      }
    } catch (err) {
      const error = err as Error;
      showErrorNotification(
        error?.message || "Registration failed. Please try again.",
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
            <h2>Join Us!</h2>
            <p>Create your account today</p>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-form-wrapper">
            <div className="auth-header">
              <h1>Create Account</h1>
              <p>Register for Admin Dashboard.</p>
            </div>

            <FormProvider {...methods}>
              <form
                onSubmit={methods.handleSubmit(onSubmit)}
                className="auth-form"
              >
                <Input
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  label="Full Name"
                />

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

                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="@P@ssword123"
                  label="Confirm Password"
                />

                <div className="form-center-text">
                  <span>Already have an account? </span>
                  <button type="button" onClick={() => navigate("/login")}>
                    Login here
                  </button>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Register"}
                </Button>
              </form>
            </FormProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
