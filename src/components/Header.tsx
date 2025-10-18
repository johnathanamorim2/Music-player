import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const Header = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex items-center justify-end mb-12 pt-4">
      {/* Título visível apenas em telas pequenas, pois a Sidebar tem o título principal */}
      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 md:hidden mr-auto">
        Music Finder
      </h1>
      
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300 hidden sm:block">
            Olá, {user.email?.split('@')[0]}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <LogOut size={20} />
          </Button>
        </div>
      )}
    </header>
  );
};