import { Song } from "@/types";
import { SongCard } from "./SongCard";
import { Music } from "lucide-react";

interface SearchResultsProps {
  results: Song[];
  onPlaySong: (song: Song) => void;
}

export const SearchResults = ({ results, onPlaySong }: SearchResultsProps) => {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500 h-64">
        <Music size={48} />
        <p className="mt-4 text-lg">Procure por uma música para começar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {results.map((song) => (
        <SongCard key={song.id} song={song} onPlay={onPlaySong} />
      ))}
    </div>
  );
};