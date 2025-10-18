import { Play, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Song } from "@/types";

interface MusicCardProps {
  song: Song;
  onPlay?: (song: Song) => void;
  onDownload?: (song: Song) => void;
  isDownloading?: boolean;
  variant: "search" | "library";
}

export const MusicCard = ({
  song,
  onPlay,
  onDownload,
  isDownloading,
  variant,
}: MusicCardProps) => {
  const { title, artist, thumbnail, duration } = song;

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAction = () => {
    if (variant === 'search' && onDownload) {
      onDownload(song);
    } else if (variant === 'library' && onPlay) {
      onPlay(song);
    }
  };

  const actionIcon = variant === 'search' 
    ? <Download size={24} /> 
    : <Play size={24} className="ml-0.5" />;

  return (
    <Card className="bg-gray-800 border-transparent text-white overflow-hidden group relative">
      <CardContent className="p-4">
        <div className="aspect-square relative mb-4">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />
          
          {isDownloading ? (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-md">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : (
            <button
              onClick={handleAction}
              className="absolute bottom-2 right-2 bg-purple-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-y-0 translate-y-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {actionIcon}
            </button>
          )}
        </div>
        <p className="font-semibold truncate">{title}</p>
        <div className="flex justify-between items-baseline">
          <p className="text-sm text-gray-400 truncate pr-2">{artist}</p>
          <p className="text-xs text-gray-500">{formatDuration(duration)}</p>
        </div>
      </CardContent>
    </Card>
  );
};