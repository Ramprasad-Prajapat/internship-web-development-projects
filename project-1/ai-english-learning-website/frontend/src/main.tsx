import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { ensureDemoPreviewData } from "./services/demoSeedService";
import "./index.css";

// Initialize mock/localStorage preview data
ensureDemoPreviewData();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element "#root" not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
