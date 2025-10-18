import { Header } from "@/components/Header";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Loader2, ListMusic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Playlists = () => {
  // TODO: Implementar busca de playlists usando React Query
  const isLoading = false;
  const playlists = []; // Placeholder

  const handleCreatePlaylist = () => {
    // TODO: Implementar lógica de criação de playlist
    alert("Criar nova playlist (A ser implementado)");
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-8 pb-32">
        <Header />
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-purple-400">Minhas Playlists</h2>
          <Button onClick={handleCreatePlaylist} className="bg-purple-600 hover:bg-purple-500">
            <Plus size={20} className="mr-2" /> Criar Playlist
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-500 h-64">
            <ListMusic size={48} />
            <p className="mt-4 text-lg">Você ainda não tem playlists.</p>
            <p className="text-sm">Crie sua primeira playlist!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playlists.map((playlist: any) => (
              <Link key={playlist.id} to={`/playlist/${playlist.id}`}>
                <Card className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-colors">
                  <CardHeader>
                    <CardTitle className="truncate">{playlist.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">0 músicas</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      <MusicPlayer />
    </div>
  );
};

export default Playlists;