import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Music } from 'lucide-react';

const AuthPage = () => {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Imagem de Fundo Desfocada (Show de Música) */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-xl scale-110"
        style={{ 
          backgroundImage: `url('/pexels-wendywei-1190297.jpg')`,
          opacity: 0.3, // Mantendo a opacidade baixa para um fundo escuro e sutil
        }}
      />
      
      {/* Overlay Escuro para garantir contraste */}
      <div className="absolute inset-0 bg-gray-900/70" />

      {/* Container de Login (Centralizado e Elevado com efeito de vidro) */}
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800/90 backdrop-blur-lg rounded-lg shadow-2xl relative z-10 border border-purple-800">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center mb-2">
            <Music 
              size={32} 
              className="mr-3 text-purple-400" 
            />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Leccor Music
            </h1>
          </div>
          <p className="mt-2 text-center text-sm text-gray-400">
            Faça login ou registre-se para salvar suas músicas
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(263 70% 50%)',
                  brandAccent: 'hsl(263 70% 60%)',
                },
                radii: {
                  borderRadiusButton: '0.5rem',
                },
              },
            },
            className: {
              button: 'bg-purple-600 hover:bg-purple-500 transition-colors',
            }
          }}
          providers={[]}
          theme="dark"
        />
      </div>
    </div>
  );
};

export default AuthPage;