import { Song } from "@/types";
import { MusicCard } from "./MusicCard";
import { Music, Loader2 } from "lucide-react";

interface SearchResultsProps {
  results: Song[];
  onDownloadSong: (song: Song) => void;
  isLoading: boolean;
  downloadingId: string | null;
}

export const SearchResults = ({ results, onDownloadSong, isLoading, downloadingId }: SearchResultsProps) => {
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
        <MusicCard
          key={song.id}
          song={song}
          onDownload={onDownloadSong}
          isDownloading={song.id === downloadingId}
          variant="search"
        />
      ))}
    </div>
  );
};