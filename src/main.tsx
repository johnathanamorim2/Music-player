import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// O registro do Service Worker é injetado automaticamente pelo vite-plugin-pwa
// Não é necessário o registro manual aqui.

createRoot(document.getElementById("root")!).render(<App />);