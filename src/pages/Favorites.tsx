import { Header } from "@/components/Header";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Loader2, Heart } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Song } from "@/types";
import { MusicCard } from "@/components/MusicCard";
import { showError, showSuccess } from "@/utils/toast";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { AddToPlaylistDialog } from "@/components/AddToPlaylistDialog";
import { useState } from "react";
import { CreatePlaylistDialog } from "@/components/CreatePlaylistDialog";

// Hook para buscar favoritos detalhados
const useDetailedFavorites = (userId: string | undefined) => {
  return useQuery<Song[]>({
    queryKey: ["detailedFavorites", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          song_id,
          songs (
            id, youtube_id, title, artist, thumbnail_url, duration, audio_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(fav => {
        const song = fav.songs as any;
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
    },
    enabled: !!userId,
  });
};

// Hook para buscar playlists (reutilizado do Index)
const useUserPlaylists = (userId: string | undefined) => {
  return useQuery<any[]>({
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
      }));
    },
    enabled: !!userId,
    initialData: [],
  });
};


const Favorites = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { setCurrentSong, setPlaylist } = useMusicPlayer();

  const { data: favoriteSongs = [], isLoading } = useDetailedFavorites(userId);
  const { data: playlists } = useUserPlaylists(userId);
  
  // Estados para Diálogos de Playlist
  const [isAddToPlaylistDialogOpen, setIsAddToPlaylistDialogOpen] = useState(false);
  const [isCreatePlaylistDialogOpen, setIsCreatePlaylistDialogOpen] = useState(false);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);

  const favoriteIds = new Set(favoriteSongs.map(s => s.db_id!));

  const handleToggleFavorite = async (song: Song) => {
    if (!song.db_id || !userId) return;

    // Remover dos favoritos
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('song_id', song.db_id);

    if (error) {
      showError("Erro ao remover dos favoritos.");
      console.error(error);
      return;
    }
    showSuccess(`"${song.title}" removida dos favoritos.`);
    
    // Invalida as queries para atualizar a lista
    queryClient.invalidateQueries({ queryKey: ["detailedFavorites", userId] });
    queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
  };

  const handlePlaySong = (song: Song) => {
    setPlaylist(favoriteSongs);
    setCurrentSong(song);
  };

  // --- Lógica de Playlists (Reutilizada) ---

  const handleOpenAddToPlaylist = (song: Song) => {
    if (!song.db_id) return;
    setSongToAddToPlaylist(song);
    setIsAddToPlaylistDialogOpen(true);
  };

  const handleAddToPlaylist = async (playlistId: string, songDbId: string) => {
    if (!userId) return;

    // 1. Verificar se a música já está na playlist
    const { data: existingEntry } = await supabase
      .from('playlist_songs')
      .select('id')
      .eq('playlist_id', playlistId)
      .eq('song_id', songDbId)
      .maybeSingle();

    if (existingEntry) {
      showError("Esta música já está nesta playlist.");
      setIsAddToPlaylistDialogOpen(false);
      return;
    }

    // 2. Encontrar a próxima posição
    const { data: maxPositionData } = await supabase
      .from('playlist_songs')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = (maxPositionData?.position || 0) + 1;

    // 3. Inserir
    const { error } = await supabase
      .from('playlist_songs')
      .insert({ 
        playlist_id: playlistId, 
        song_id: songDbId, 
        position: nextPosition 
      });

    if (error) {
      showError("Erro ao adicionar música à playlist.");
      console.error(error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["playlists", userId] });
    queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
    showSuccess(`Música adicionada à playlist!`);
    setIsAddToPlaylistDialogOpen(false);
  };

  const handleCreateNewPlaylist = async (name: string, songDbId?: string) => {
    if (!userId) return;

    const { data: newPlaylist, error } = await supabase
      .from('playlists')
      .insert({ user_id: userId, name: name })
      .select('id')
      .single();

    if (error) {
      showError("Erro ao criar playlist.");
      console.error(error);
      return;
    }

    showSuccess(`Playlist "${name}" criada com sucesso!`);
    
    if (songDbId && newPlaylist) {
      await handleAddToPlaylist(newPlaylist.id, songDbId);
    }

    queryClient.invalidateQueries({ queryKey: ["playlists", userId] });
  };

  const handleOpenCreateNewPlaylist = () => {
    setIsAddToPlaylistDialogOpen(false);
    setIsCreatePlaylistDialogOpen(true);
  };

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {favoriteSongs.map((song) => (
              <MusicCard
                key={song.db_id}
                song={song}
                onPlay={handlePlaySong}
                onToggleFavorite={handleToggleFavorite}
                onAddToPlaylist={handleOpenAddToPlaylist}
                isFavorite={favoriteIds.has(song.db_id!)}
                variant="library"
              />
            ))}
          </div>
        )}
      </div>
      <MusicPlayer />

      {/* Diálogo de Adicionar à Playlist */}
      {songToAddToPlaylist?.db_id && (
        <AddToPlaylistDialog
          songDbId={songToAddToPlaylist.db_id}
          isOpen={isAddToPlaylistDialogOpen}
          onClose={() => setIsAddToPlaylistDialogOpen(false)}
          playlists={playlists}
          onAddToPlaylist={handleAddToPlaylist}
          onOpenCreateNewPlaylist={handleOpenCreateNewPlaylist}
        />
      )}

      {/* Diálogo de Criar Nova Playlist */}
      <CreatePlaylistDialog
        isOpen={isCreatePlaylistDialogOpen}
        onClose={() => setIsCreatePlaylistDialogOpen(false)}
        onCreate={(name) => handleCreateNewPlaylist(name, songToAddToPlaylist?.db_id)}
        initialSongId={songToAddToPlaylist?.db_id}
      />
    </div>
  );
};

export default Favorites;