import { Header } from "@/components/Header";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Loader2, Heart } from "lucide-react";

const Favorites = () => {
  // TODO: Implementar busca de favoritos usando React Query
  const isLoading = false;
  const favoriteSongs = []; // Placeholder

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-8 pb-32">
        <Header />
        <h2 className="text-3xl font-bold mb-8 text-purple-400">Minhas Músicas Favoritas</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : favoriteSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-500 h-64">
            <Heart size={48} />
            <p className="mt-4 text-lg">Você ainda não tem músicas favoritas.</p>
            <p className="text-sm">Adicione músicas da sua biblioteca aos favoritos.</p>
          </div>
        ) : (
          // TODO: Implementar listagem de MusicCard para favoritos
          <p className="text-gray-400">Lista de favoritos será implementada aqui.</p>
        )}
      </div>
      <MusicPlayer />
    </div>
  );
};

export default Favorites;