import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AuthPage = () => {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-center text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Leccor Music
          </h1>
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
                  // Cor primária para botões e links
                  brand: 'hsl(263 70% 50%)', // Roxo base (aproximado do purple-600)
                  brandAccent: 'hsl(263 70% 60%)', // Roxo hover (aproximado do purple-500)
                },
                // Customização do botão primário
                radii: {
                  borderRadiusButton: '0.5rem', // Arredondamento padrão
                },
              },
            },
            // Customização via className para garantir que o hover funcione
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