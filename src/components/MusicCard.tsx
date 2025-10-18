import { Play, Download, Loader2, Heart, ListMusic, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Song } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MusicCardProps {
  song: Song;
  onPlay?: (song: Song) => void;
  onDownload?: (song: Song) => void;
  onDelete?: (song: Song) => void;
  onToggleFavorite?: (song: Song) => void;
  onAddToPlaylist?: (song: Song) => void;
  isDownloading?: boolean;
  isFavorite?: boolean;
  variant: "search" | "library" | "playlist";
}

export const MusicCard = ({
  song,
  onPlay,
  onDownload,
  onDelete,
  onToggleFavorite,
  onAddToPlaylist,
  isDownloading,
  isFavorite = false,
  variant,
}: MusicCardProps) => {
  const { title, artist, thumbnail, duration } = song;

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePrimaryAction = () => {
    if (variant === 'search' && onDownload) {
      onDownload(song);
    } else if ((variant === 'library' || variant === 'playlist') && onPlay) {
      onPlay(song);
    }
  };

  const primaryActionIcon = variant === 'search' 
    ? <Download size={24} /> 
    : <Play size={24} className="ml-0.5" />;

  const renderLibraryActions = () => {
    // Ações para Library (Favoritar, Adicionar à Playlist, Deletar da Biblioteca)
    if (variant === 'library' || variant === 'favorites') {
      return (
        <>
          {onToggleFavorite && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(song); }}
                  className={`w-8 h-8 rounded-full ${isFavorite ? 'text-red-500 hover:bg-gray-700' : 'text-white hover:bg-gray-700'}`}
                >
                  <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
              </TooltipContent>
            </Tooltip>
          )}
          {onAddToPlaylist && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={(e) => { e.stopPropagation(); onAddToPlaylist(song); }}
                  className="w-8 h-8 rounded-full text-white hover:bg-gray-700"
                >
                  <ListMusic size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adicionar à Playlist</TooltipContent>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={(e) => { e.stopPropagation(); onDelete(song); }}
                  className="w-8 h-8 rounded-full text-red-400 hover:bg-gray-700"
                >
                  <Trash2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remover da Biblioteca</TooltipContent>
            </Tooltip>
          )}
        </>
      );
    }
    
    // Ações para Playlist (Apenas Deletar da Playlist)
    if (variant === 'playlist' && onDelete) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={(e) => { e.stopPropagation(); onDelete(song); }}
              className="w-8 h-8 rounded-full text-red-400 hover:bg-gray-700"
            >
              <Trash2 size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remover da Playlist</TooltipContent>
        </Tooltip>
      );
    }

    return null;
  };

  return (
    <Card className="bg-gray-800 border-transparent text-white overflow-hidden group relative cursor-pointer" onClick={handlePrimaryAction}>
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
              onClick={(e) => { e.stopPropagation(); handlePrimaryAction(); }}
              className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-y-0 translate-y-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {primaryActionIcon}
            </button>
          )}
          
          {(variant === 'library' || variant === 'playlist') && (
            <div className="absolute top-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {renderLibraryActions()}
            </div>
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