import { Song } from "@/types";
import { SongCard } from "./SongCard";
import { Music, Loader2, Download } from "lucide-react";

interface SearchResultsProps {
  results: Song[];
  onDownloadSong: (song: Song) => void;
  isLoading: boolean;
}

export const SearchResults = ({ results, onDownloadSong, isLoading }: SearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500 h-64">
        <Loader2 size={48} className="animate-spin text-purple-400" />
        <p className="mt-4 text-lg">Buscando músicas...</p>
      </div>
    );
  }

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
        <SongCard
          key={song.id}
          song={song}
          onAction={onDownloadSong}
          actionIcon={<Download size={24} />}
        />
      ))}
    </div>
  );
};