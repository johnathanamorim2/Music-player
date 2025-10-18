import { createContext, useContext, useState, ReactNode } from "react";
import { Song } from "@/types";

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
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);

  const playNext = () => {
    if (playlist.length === 0 || !currentSong) return;
    const currentIndex = playlist.findIndex((s) => s.id === currentSong.id);
    if (currentIndex === -1) {
      setCurrentSong(playlist[0]);
      return;
    }
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentSong(playlist[nextIndex]);
  };

  const playPrevious = () => {
    if (playlist.length === 0 || !currentSong) return;
    const currentIndex = playlist.findIndex((s) => s.id === currentSong.id);
    if (currentIndex === -1) {
      setCurrentSong(playlist[0]);
      return;
    }
    const previousIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentSong(playlist[previousIndex]);
  };

  const closePlayer = () => {
    setCurrentSong(null);
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