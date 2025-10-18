import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { Song } from "@/types";
import { useAuth } from "@/hooks/useAuth";

// Função utilitária para embaralhar um array (Fisher-Yates)
const shuffleArray = (array: Song[]): Song[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

interface MusicPlayerContextType {
  currentSong: Song | null;
  playlist: Song[];
  setCurrentSong: (song: Song | null) => void;
  setPlaylist: (songs: Song[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  closePlayer: () => void;
  isShuffling: boolean;
  toggleShuffle: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
  undefined,
);

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [originalPlaylist, setOriginalPlaylist] = useState<Song[]>([]); // Lista original (ordenada)
  const [playlist, setShuffledPlaylist] = useState<Song[]>([]); // Lista atual (embaralhada ou não)
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null | undefined>(authLoading ? undefined : user?.id);

  const closePlayer = () => {
    setCurrentSong(null);
    setShuffledPlaylist([]);
    setOriginalPlaylist([]);
  };

  // Efeito para resetar o player quando o usuário muda
  useEffect(() => {
    if (authLoading) return;

    const currentUserId = user?.id || null;

    if (lastUserId !== undefined && lastUserId !== currentUserId) {
      console.log(`[MusicPlayer] User changed from ${lastUserId} to ${currentUserId}. Resetting player state.`);
      closePlayer();
    }
    
    setLastUserId(currentUserId);
  }, [user, authLoading, lastUserId]);

  // Função para definir a playlist, aplicando shuffle se necessário
  const setPlaylist = useCallback((songs: Song[]) => {
    setOriginalPlaylist(songs);
    if (isShuffling) {
      setShuffledPlaylist(shuffleArray(songs));
    } else {
      setShuffledPlaylist(songs);
    }
  }, [isShuffling]);

  // Efeito para re-embaralhar ou reverter a playlist quando isShuffling muda
  useEffect(() => {
    if (isShuffling) {
      // Re-embaralha a lista original
      setShuffledPlaylist(shuffleArray(originalPlaylist));
    } else {
      // Restaura a lista original
      setShuffledPlaylist(originalPlaylist);
    }
    // Não precisamos verificar currentSong aqui, pois ele mantém a referência.
    // A navegação (playNext/playPrevious) usará a nova ordem da lista 'playlist'.
  }, [isShuffling, originalPlaylist]);


  const toggleShuffle = () => {
    setIsShuffling(prev => !prev);
  };

  const playNext = () => {
    if (playlist.length === 0 || !currentSong) return;
    
    // Encontra o índice da música atual na lista ATUAL (embaralhada ou não)
    const currentIndex = playlist.findIndex((s) => s.db_id === currentSong.db_id);
    
    if (currentIndex === -1) {
      // Se a música atual não for encontrada (ex: foi deletada), começa do início
      setCurrentSong(playlist[0]);
      return;
    }
    
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentSong(playlist[nextIndex]);
  };

  const playPrevious = () => {
    if (playlist.length === 0 || !currentSong) return;
    
    // Encontra o índice da música atual na lista ATUAL (embaralhada ou não)
    const currentIndex = playlist.findIndex((s) => s.db_id === currentSong.db_id);
    
    if (currentIndex === -1) {
      setCurrentSong(playlist[0]);
      return;
    }
    
    const previousIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentSong(playlist[previousIndex]);
  };


  const value = {
    currentSong,
    playlist,
    setCurrentSong,
    setPlaylist,
    playNext,
    playPrevious,
    closePlayer,
    isShuffling,
    toggleShuffle,
  };

  return (
    <MusicPlayerContext.Provider
      value={value}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
};