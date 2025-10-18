import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth"; // Renomeado de Login
import NotFound from "./pages/NotFound";
import { MusicPlayerProvider } from "./contexts/MusicPlayerContext"; // Caminho atualizado
import { AuthProvider } from "./contexts/AuthContext"; // Caminho atualizado
import ProtectedRoute from "./components/ProtectedRoute";
import Favorites from "./pages/Favorites"; // Novo componente
import Playlists from "./pages/Playlists"; // Novo componente
import PlaylistDetail from "./pages/PlaylistDetail"; // Novo componente

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <MusicPlayerProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Rota de autenticação */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Rotas protegidas (usando ProtectedRoute como layout) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/playlist/:id" element={<PlaylistDetail />} />
              </Route>
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </MusicPlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;