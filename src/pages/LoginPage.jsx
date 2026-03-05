import { useState } from "react";
import "../styles/layout.css";
import { GoogleLogin } from "@react-oauth/google";

function LoginPage({ onLogin }) {

  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ---------------- NORMAL LOGIN / REGISTER ---------------- */

  const handleSubmit = async () => {

    if (!email || !password || (isRegister && !name)) {
      alert("Please fill all fields");
      return;
    }

    try {

      const url = isRegister
        ? "http://localhost:5000/api/auth/register"
        : "http://localhost:5000/api/auth/login";

      const body = isRegister
        ? { name, email, password }
        : { email, password };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      /* ---------------- REGISTER ---------------- */

      if (isRegister) {

        alert("Account created successfully. Please login.");

        setIsRegister(false);
        setName("");
        setEmail("");
        setPassword("");

      }

      /* ---------------- LOGIN ---------------- */

      else {

        if (!data.user) {
          alert("Login failed");
          return;
        }

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        alert("Login successful");

        onLogin();

      }

    } catch (err) {

      console.log("Login error:", err);
      alert("Server error. Make sure backend is running.");

    }

  };

  /* ---------------- GOOGLE LOGIN ---------------- */

  const handleGoogleLogin = async (credentialResponse) => {

    try {

      const token = credentialResponse.credential;

      const res = await fetch(
        "http://localhost:5000/api/auth/google",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      /* Save Google user */

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      alert("Google login successful");

      onLogin();

    } catch (err) {

      console.log("Google login error:", err);

      alert("Google login failed");

    }

  };

  return (

    <div className="login-container">

      <div className="login-box">

        <h2>
          {isRegister ? "Create Account" : "Login"}
        </h2>

        {isRegister && (

          <input
            type="text"
            placeholder="Full Name"
            className="login-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

        )}

        <input
          type="email"
          placeholder="Email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="primary-btn login-btn"
          onClick={handleSubmit}
        >
          {isRegister ? "Register" : "Login"}
        </button>

        {/* GOOGLE LOGIN */}

        <div style={{ marginTop: "20px" }}>

          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => {
              console.log("Google Login Failed");
              alert("Google Login Failed");
            }}
          />

        </div>

        <p className="login-switch">

          {isRegister
            ? "Already have an account?"
            : "New user?"}

          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{
              cursor: "pointer",
              marginLeft: "5px",
              color: "#3b82f6"
            }}
          >
            {isRegister ? "Login" : "Create Account"}
          </span>

        </p>

      </div>

    </div>

  );

}

export default LoginPage;