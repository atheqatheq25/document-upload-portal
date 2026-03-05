import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="1088209349644-scrmrf3r7h8nopukmr58jd4d1sf9ah3f.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);