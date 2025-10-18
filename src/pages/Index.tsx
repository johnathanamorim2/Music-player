import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Song, Playlist } from "@/types";
import { SearchResults } from "@/components/SearchResults";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Library } from "@/components/Library";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { FunctionsHttpError } from '@supabase/supabase-js';
import { SearchBar } from "@/components/SearchBar";
import { AddToPlaylistDialog } from "@/components/AddToPlaylistDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreatePlaylistDialog } from "@/components/CreatePlaylistDialog";

// --- Hooks de Dados ---

const useUserFavorites = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data, error } = await supabase
        .from('favorites')
        .select('song_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      return new Set(data.map(f => f.song_id));
    },
    enabled: !!userId,
    initialData: new Set<string>(),
  });
};

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

// --- Componente Principal ---

const Index = () => {
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Estados para Diálogos de Playlist
  const [isAddToPlaylistDialogOpen, setIsAddToPlaylistDialogOpen] = useState(false);
  const [isCreatePlaylistDialogOpen, setIsCreatePlaylistDialogOpen] = useState(false);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);
  
  const { setCurrentSong, setPlaylist } = useMusicPlayer();
  const { session, user } = useAuth();
  const queryClient = useQueryClient();

  const userId = user?.id;

  // Query para a Biblioteca
  const { data: library = [], isLoading: isLibraryLoading } = useQuery({
    queryKey: ["songs", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(song => ({
        id: song.youtube_id,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail_url,
        duration: song.duration,
        db_id: song.id,
        audio_url: song.audio_url,
      })) as Song[];
    },
    enabled: !!userId,
  });

  // Queries para Favoritos e Playlists
  const { data: favoriteIds } = useUserFavorites(userId);
  const { data: playlists, refetch: refetchPlaylists } = useUserPlaylists(userId);

  useEffect(() => {
    setPlaylist(library);
  }, [library, setPlaylist]);

  const getDetailedErrorMessage = useCallback(async (error: any): Promise<string> => {
    console.error("Objeto de erro completo da Supabase Function:", error);
    
    if (error instanceof FunctionsHttpError) {
      try {
        const errorBody = await error.context.json();
        return errorBody.error || JSON.stringify(errorBody);
      } catch (e) {
        try {
          const textError = await error.context.text();
          if (textError.includes("Unexpected token '<'") || textError.includes("Não foi possível buscar músicas")) {
             return "O serviço de busca está temporariamente instável. Tente novamente.";
          }
          return textError || error.message;
        } catch (textE) {
          return error.message;
        }
      }
    }
    
    return error.message || "Ocorreu um erro desconhecido.";
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim() || isLoading || !session) return;

    setIsLoading(true);
    setSearchResults([]);

    const { data, error } = await supabase.functions.invoke('search-and-download', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { action: 'search', query: query },
    });
    
    setIsLoading(false);

    if (error) {
      const message = await getDetailedErrorMessage(error);
      showError(`Erro ao buscar: ${message}`);
      return;
    }

    if (data && data.results) {
      setSearchResults(data.results.map((s: any) => ({...s, id: s.id})));
    }
  };

  const handleDownloadSong = async (song: Song) => {
    if (library.some(s => s.id === song.id) || downloadingId) {
      showError("Essa música já está na sua biblioteca.");
      return;
    }
    if (!session) return;

    setDownloadingId(song.id);

    const { data, error } = await supabase.functions.invoke('search-and-download', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { action: 'download', videoId: song.id },
    });

    setDownloadingId(null);

    if (error) {
      const message = await getDetailedErrorMessage(error);
      showError(`Erro ao adicionar música: ${message}`);
      return;
    }
      
    if (data && data.song) {
      queryClient.invalidateQueries({ queryKey: ["songs", userId] });
      showSuccess(`"${song.title}" foi adicionada à sua biblioteca!`);
    }
  };

  const handleDeleteSong = async (song: Song) => {
    if (!song.db_id) return;
    
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', song.db_id);

    if (error) {
      showError("Erro ao remover música da biblioteca.");
      console.error(error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["songs", userId] });
    queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
    showSuccess(`"${song.title}" removida da biblioteca.`);
  };

  const handleToggleFavorite = async (song: Song) => {
    if (!song.db_id || !userId) return;

    const isCurrentlyFavorite = favoriteIds.has(song.db_id);
    
    if (isCurrentlyFavorite) {
      // Remover
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
    } else {
      // Adicionar
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, song_id: song.db_id });

      if (error) {
        showError("Erro ao adicionar aos favoritos.");
        console.error(error);
        return;
      }
      showSuccess(`"${song.title}" adicionada aos favoritos!`);
    }
    queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
  };

  const handlePlaySong = (song: Song) => {
    setPlaylist(library);
    setCurrentSong(song);
  };

  // --- Lógica de Playlists ---

  const handleOpenAddToPlaylist = (song: Song) => {
    if (!song.db_id) {
      showError("Música deve estar na biblioteca para ser adicionada a uma playlist.");
      return;
    }
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
    
    // Se houver uma música para adicionar, adicione-a
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
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        
        <main className="mt-12">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-gray-800 text-gray-400">
              <TabsTrigger value="search">Buscar</TabsTrigger>
              <TabsTrigger value="library">Minha Biblioteca</TabsTrigger>
            </TabsList>
            <TabsContent value="search">
              <SearchResults 
                results={searchResults} 
                onDownloadSong={handleDownloadSong} 
                isLoading={isLoading}
                downloadingId={downloadingId}
              />
            </TabsContent>
            <TabsContent value="library">
              {isLibraryLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                </div>
              ) : (
                <Library 
                  songs={library} 
                  onPlaySong={handlePlaySong} 
                  onDeleteSong={handleDeleteSong}
                  onToggleFavorite={handleToggleFavorite}
                  onAddToPlaylist={handleOpenAddToPlaylist}
                  favoriteIds={favoriteIds}
                />
              )}
            </TabsContent>
          </Tabs>
        </main>
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

export default Index;