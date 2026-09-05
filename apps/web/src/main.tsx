import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./styles.css";

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    const check = () => registration.update().catch(() => undefined);
    window.addEventListener("focus", check);
    window.addEventListener("online", check);
    window.setInterval(check, 60_000);
  },
  onNeedRefresh() {
    updateSW(true);
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
