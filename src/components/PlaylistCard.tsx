import { Playlist } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListMusic } from "lucide-react";
import { Link } from "react-router-dom";

interface PlaylistCardProps {
  playlist: Playlist;
}

export const PlaylistCard = ({ playlist }: PlaylistCardProps) => {
  return (
    <Link to={`/playlist/${playlist.id}`}>
      <Card className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-colors h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold truncate">{playlist.name}</CardTitle>
          <ListMusic className="h-5 w-5 text-purple-400" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{playlist.song_count}</p>
          <p className="text-xs text-gray-400">músicas</p>
        </CardContent>
      </Card>
    </Link>
  );
};