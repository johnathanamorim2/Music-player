import { MusicPlayer } from "@/components/MusicPlayer";
import { Loader2, ListMusic, ArrowLeft, Trash2, Play } from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Song } from "@/types";
import { MusicCard } from "@/components/MusicCard";
import { showError, showSuccess } from "@/utils/toast";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface PlaylistDetailData {
  name: string;
  songs: Song[];
}

const usePlaylistDetail = (playlistId: string | undefined, userId: string | undefined) => {
  return useQuery<PlaylistDetailData>({
    queryKey: ["playlist", playlistId],
    queryFn: async () => {
      if (!playlistId || !userId) return { name: "Playlist", songs: [] };

      // 1. Buscar detalhes da playlist
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('name')
        .eq('id', playlistId)
        .eq('user_id', userId)
        .single();

      if (playlistError || !playlistData) {
        throw new Error("Playlist não encontrada ou acesso negado.");
      }

      // 2. Buscar músicas na playlist
      const { data: songsData, error: songsError } = await supabase
        .from('playlist_songs')
        .select(`
          position,
          song_id,
          songs (
            id, youtube_id, title, artist, thumbnail_url, duration, audio_url
          )
        `)
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (songsError) throw songsError;

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
          position: item.position, // Adicionando posição para ordenação
        } as Song;
      });

      return {
        name: playlistData.name,
        songs: songs,
      };
    },
    enabled: !!playlistId && !!userId,
    initialData: { name: "Carregando...", songs: [] },
  });
};

const PlaylistDetail = () => {
  const { id: playlistId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { setCurrentSong, setPlaylist } = useMusicPlayer();

  const { data: playlist, isLoading } = usePlaylistDetail(playlistId, userId);

  const handlePlaySong = (song: Song) => {
    setPlaylist(playlist.songs);
    setCurrentSong(song);
  };
  
  const handlePlayPlaylist = () => {
    if (playlist.songs.length === 0) {
      showError("A playlist está vazia.");
      return;
    }
    setPlaylist(playlist.songs);
    setCurrentSong(playlist.songs[0]);
  };

  const handleDeleteSongFromPlaylist = async (song: Song) => {
    if (!playlistId || !song.db_id) return;

    // 1. Deletar a entrada em playlist_songs
    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', song.db_id);

    if (error) {
      showError("Erro ao remover música da playlist.");
      console.error(error);
      return;
    }

    showSuccess(`"${song.title}" removida da playlist.`);
    
    // 2. Invalida a query para atualizar a lista
    queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
    queryClient.invalidateQueries({ queryKey: ["playlists", userId] });
  };

  const handleDeletePlaylist = async () => {
    if (!playlistId || !confirm(`Tem certeza que deseja deletar a playlist "${playlist.name}"?`)) return;

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId)
      .eq('user_id', userId); // RLS deve garantir isso, mas é bom ter no cliente

    if (error) {
      showError("Erro ao deletar playlist.");
      console.error(error);
      return;
    }

    showSuccess(`Playlist "${playlist.name}" deletada.`);
    queryClient.invalidateQueries({ queryKey: ["playlists", userId] });
    navigate('/playlists');
  };

  return (
    <>
      <Link to="/playlists" className="flex items-center text-gray-400 hover:text-purple-400 mb-6 transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Voltar para Playlists
      </Link>
      
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h2 className="text-4xl font-bold text-purple-400">{playlist.name}</h2>
        <div className="flex gap-4">
          <Button 
            onClick={handlePlayPlaylist} 
            disabled={isLoading || playlist.songs.length === 0}
            className="bg-green-600 hover:bg-green-500"
          >
            <Play size={20} className="mr-2" /> Reproduzir Playlist
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeletePlaylist} 
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-500"
          >
            <Trash2 size={20} className="mr-2" /> Deletar Playlist
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
        </div>
      ) : playlist.songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-500 h-64">
          <ListMusic size={48} />
          <p className="mt-4 text-lg">Esta playlist está vazia.</p>
          <p className="text-sm">Adicione músicas da sua biblioteca na página inicial.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {playlist.songs.map((song) => (
            <MusicCard
              key={song.db_id}
              song={song}
              onPlay={handlePlaySong}
              onDelete={handleDeleteSongFromPlaylist}
              variant="playlist"
            />
          ))}
        </div>
      )}
    </>
  );
};

export default PlaylistDetail;