import { Playlist } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListMusic, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PlaylistCardProps {
  playlist: Playlist;
  onPlay: (playlist: Playlist) => void;
}

export const PlaylistCard = ({ playlist, onPlay }: PlaylistCardProps) => {
  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Previne a navegação do Link
    e.stopPropagation();
    onPlay(playlist);
  };

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-colors h-full relative group">
      <Link to={`/playlist/${playlist.id}`} className="block h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold truncate pr-10">{playlist.name}</CardTitle>
          <ListMusic className="h-5 w-5 text-purple-400" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{playlist.song_count}</p>
          <p className="text-xs text-gray-400">músicas</p>
        </CardContent>
      </Link>
      
      {/* Botão de Play flutuante */}
      <Button
        size="icon"
        className="absolute bottom-4 right-4 bg-green-600 hover:bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0"
        onClick={handlePlayClick}
        disabled={playlist.song_count === 0}
      >
        <Play size={20} fill="currentColor" className="ml-0.5" />
      </Button>
    </Card>
  );
};