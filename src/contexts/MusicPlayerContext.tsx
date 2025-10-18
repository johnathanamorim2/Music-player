import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Song } from "@/types";
import { useAuth } from "@/hooks/useAuth"; // Importando useAuth

interface MusicPlayerContextType {
  currentSong: Song | null;
  playlist: Song[];
  setCurrentSong: (song: Song | null) => void;
  setPlaylist: (songs: Song[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  closePlayer: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
  undefined,
);

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth(); // Usando useAuth
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [lastUserId, setLastUserId] = useState<string | null | undefined>(authLoading ? undefined : user?.id);

  const closePlayer = () => {
    setCurrentSong(null);
    setPlaylist([]);
  };

  // Efeito para resetar o player quando o usuário muda
  useEffect(() => {
    if (authLoading) return;

    const currentUserId = user?.id || null;

    // Se o ID do usuário mudou (incluindo de logado para deslogado, ou de UserA para UserB)
    if (lastUserId !== undefined && lastUserId !== currentUserId) {
      console.log(`[MusicPlayer] User changed from ${lastUserId} to ${currentUserId}. Resetting player state.`);
      closePlayer();
    }
    
    setLastUserId(currentUserId);
  }, [user, authLoading, lastUserId]);


  const playNext = () => {
    if (playlist.length === 0 || !currentSong) return;
    const currentIndex = playlist.findIndex((s) => s.db_id === currentSong.db_id);
    if (currentIndex === -1) {
      setCurrentSong(playlist[0]);
      return;
    }
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentSong(playlist[nextIndex]);
  };

  const playPrevious = () => {
    if (playlist.length === 0 || !currentSong) return;
    const currentIndex = playlist.findIndex((s) => s.db_id === currentSong.db_id);
    if (currentIndex === -1) {
      setCurrentSong(playlist[0]);
      return;
    }
    const previousIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentSong(playlist[previousIndex]);
  };


  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        playlist,
        setCurrentSong,
        setPlaylist,
        playNext,
        playPrevious,
        closePlayer,
      }}
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