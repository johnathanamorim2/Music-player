import { Song } from "@/types";
import { MusicCard } from "./MusicCard";
import { Music } from "lucide-react";

interface LibraryProps {
  songs: Song[];
  onPlaySong: (song: Song) => void;
  onDeleteSong: (song: Song) => void;
  onToggleFavorite: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
  favoriteIds: Set<string>;
}

export const Library = ({ songs, onPlaySong, onDeleteSong, onToggleFavorite, onAddToPlaylist, favoriteIds }: LibraryProps) => {
  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500 h-64">
        <Music size={48} />
        <p className="mt-4 text-lg">Sua biblioteca está vazia.</p>
        <p className="text-sm">Use a busca para encontrar e baixar músicas.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Minha Biblioteca</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {songs.map((song) => (
          <MusicCard
            key={song.db_id}
            song={song}
            onPlay={onPlaySong}
            onDelete={onDeleteSong}
            onToggleFavorite={onToggleFavorite}
            onAddToPlaylist={onAddToPlaylist}
            isFavorite={favoriteIds.has(song.db_id!)}
            variant="library"
          />
        ))}
      </div>
    </div>
  );
};