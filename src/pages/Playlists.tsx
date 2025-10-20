import { MusicPlayer } from "@/components/MusicPlayer";
import { Loader2, ListMusic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Playlist, Song } from "@/types";
import { PlaylistCard } from "@/components/PlaylistCard";
import { CreatePlaylistDialog } from "@/components/CreatePlaylistDialog";
import { useState } from "react";
import { showError, showSuccess } from "@/utils/toast";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext"; // Importando useMusicPlayer

// Hook para buscar playlists (com contagem de músicas)
const useUserPlaylists = (userId: string | undefined) => {
  return useQuery<Playlist[]>({
    queryKey: ["playlists", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          id, 
          name, 
          user_id,
          playlist_songs(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(p => ({
        id: p.id,
        name: p.name,
        user_id: p.user_id,
        song_count: p.playlist_songs[0]?.count || 0,
      })) as Playlist[];
    },
    enabled: !!userId,
    initialData: [],
  });
};

const Playlists = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { setCurrentSong, setPlaylist } = useMusicPlayer(); // Usando o player context
  
  const { data: playlists = [], isLoading } = useUserPlaylists(userId);
  const [isCreatePlaylistDialogOpen, setIsCreatePlaylistDialogOpen] = useState(false);

  const handleCreatePlaylist = async (name: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('playlists')
      .insert({ user_id: userId, name: name });

    if (error) {
      showError("Erro ao criar playlist.");
      console.error(error);
      return;
    }

    showSuccess(`Playlist "${name}" criada com sucesso!`);
    queryClient.invalidateQueries({ queryKey: ["playlists", userId] });
  };

  const handlePlayPlaylist = async (playlist: Playlist) => {
    if (playlist.song_count === 0) {
      showError("A playlist está vazia.");
      return;
    }

    // Busca as músicas detalhadas da playlist
    const { data: songsData, error: songsError } = await supabase
      .from('playlist_songs')
      .select(`
        position,
        song_id,
        songs (
          id, youtube_id, title, artist, thumbnail_url, duration, audio_url
        )
      `)
      .eq('playlist_id', playlist.id)
      .order('position', { ascending: true });

    if (songsError) {
      showError("Erro ao carregar músicas da playlist.");
      console.error(songsError);
      return;
    }

    const songs: Song[] = songsData.map(item => {
      const song = item.songs as any;
      return {
        id: song.youtube_id,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail_url,
        duration: song.duration,
        db_id: song.id,
        audio_url: song.audio_url,
      } as Song;
    });

    if (songs.length > 0) {
      setPlaylist(songs);
      setCurrentSong(songs[0]);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-purple-400">Minhas Playlists</h2>
        <Button 
          onClick={() => setIsCreatePlaylistDialogOpen(true)} 
          className="bg-purple-600 hover:bg-purple-500"
        >
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
          {playlists.map((playlist) => (
            <PlaylistCard 
              key={playlist.id} 
              playlist={playlist} 
              onPlay={handlePlayPlaylist} // Passando a função de reprodução
            />
          ))}
        </div>
      )}
      
      <CreatePlaylistDialog
        isOpen={isCreatePlaylistDialogOpen}
        onClose={() => setIsCreatePlaylistDialogOpen(false)}
        onCreate={(name) => handleCreatePlaylist(name)}
      />
    </>
  );
};

export default Playlists;