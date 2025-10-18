import { Header } from "@/components/Header";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Loader2, ListMusic, ArrowLeft } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PlaylistDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  // TODO: Implementar busca de detalhes da playlist e músicas
  const isLoading = false;
  const playlist = { name: "Minha Playlist", songs: [] }; // Placeholder

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-8 pb-32">
        <Header />
        <Link to="/playlists" className="flex items-center text-gray-400 hover:text-purple-400 mb-6 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Voltar para Playlists
        </Link>
        
        <h2 className="text-4xl font-bold mb-8 text-purple-400">{playlist.name}</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : playlist.songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-500 h-64">
            <ListMusic size={48} />
            <p className="mt-4 text-lg">Esta playlist está vazia.</p>
            <p className="text-sm">Adicione músicas da sua biblioteca.</p>
          </div>
        ) : (
          // TODO: Implementar listagem de músicas da playlist
          <p className="text-gray-400">Lista de músicas da playlist {id} será implementada aqui.</p>
        )}
      </div>
      <MusicPlayer />
    </div>
  );
};

export default PlaylistDetail;