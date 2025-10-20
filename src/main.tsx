import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Registro explícito do Service Worker para garantir que o PWA seja detectado
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration);
      })
      .catch(error => {
        console.error('Falha no registro do Service Worker:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);