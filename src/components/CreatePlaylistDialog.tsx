import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface CreatePlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  initialSongId?: string; // Opcional: se estiver criando e adicionando uma música
}

export const CreatePlaylistDialog = ({ 
  isOpen, 
  onClose, 
  onCreate, 
  initialSongId 
}: CreatePlaylistDialogProps) => {
  const [playlistName, setPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim() || isCreating) return;
    
    setIsCreating(true);
    await onCreate(playlistName.trim());
    setIsCreating(false);
    setPlaylistName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Criar Nova Playlist</DialogTitle>
          <DialogDescription className="text-gray-400">
            Digite um nome para sua nova playlist.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-gray-300">
                Nome
              </Label>
              <Input
                id="name"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                disabled={isCreating}
                required
              />
            </div>
            {initialSongId && (
              <p className="text-sm text-gray-500 text-center">
                A música será adicionada a esta nova playlist.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-500" 
              disabled={isCreating || !playlistName.trim()}
            >
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};