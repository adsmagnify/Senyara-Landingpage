import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import App from "./App.jsx";
import { ThankYou } from "./ThankYou.jsx";
import "./styles.css";

function ScrollOnNavigate() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollOnNavigate />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/thank-you/:id" element={<ThankYou />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
