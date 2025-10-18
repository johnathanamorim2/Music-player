import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListMusic, Plus } from "lucide-react";
import { Playlist } from "@/types";

interface AddToPlaylistDialogProps {
  songDbId: string; // Usando o db_id da música
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  onAddToPlaylist: (playlistId: string, songDbId: string) => void;
  onOpenCreateNewPlaylist: () => void;
}

export const AddToPlaylistDialog = ({ 
  songDbId, 
  isOpen, 
  onClose, 
  playlists, 
  onAddToPlaylist, 
  onOpenCreateNewPlaylist 
}: AddToPlaylistDialogProps) => {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Adicionar à Playlist</DialogTitle>
          <DialogDescription className="text-gray-400">
            Selecione uma playlist para adicionar a música.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button 
            onClick={onOpenCreateNewPlaylist} 
            className="w-full bg-purple-600 hover:bg-purple-500"
          >
            <Plus size={16} className="mr-2" /> Criar Nova Playlist
          </Button>

          <ScrollArea className="h-[200px] w-full rounded-md border border-gray-700 p-2">
            {playlists.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Nenhuma playlist encontrada.</p>
            ) : (
              <div className="space-y-1">
                {playlists.map((playlist) => (
                  <div 
                    key={playlist.id} 
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => onAddToPlaylist(playlist.id, songDbId)}
                  >
                    <div className="flex items-center">
                      <ListMusic size={18} className="mr-3 text-gray-400" />
                      <span className="truncate">{playlist.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{playlist.song_count}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};