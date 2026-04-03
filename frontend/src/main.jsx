import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AppProvider } from "./context/AppContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
);