import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2 } from "lucide-react";
import { Song } from "@/types";
import { SearchResults } from "@/components/SearchResults";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Library } from "@/components/Library";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useMusicPlayer } from "@/context/MusicPlayerContext";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [library, setLibrary] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { setCurrentSong, setPlaylist } = useMusicPlayer();

  useEffect(() => {
    setPlaylist(library);
  }, [library, setPlaylist]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || isLoading) return;

    setIsLoading(true);
    setSearchResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('search-youtube', {
        body: { query: searchTerm },
      });

      if (error) throw error;
      if (data) setSearchResults(data);

    } catch (error: any) {
      const errorMessage = error.context?.error?.message || error.message || 'Ocorreu um erro desconhecido';
      showError(`Erro ao buscar: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSong = async (song: Song) => {
    if (library.some(s => s.id === song.id)) {
      showError("Essa música já está na sua biblioteca.");
      return;
    }
    if (downloadingId) return;

    setDownloadingId(song.id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLibrary(prevLibrary => [...prevLibrary, song]);
    showSuccess(`"${song.title}" foi adicionada à sua biblioteca!`);
    setDownloadingId(null);
  };

  const handlePlaySong = (song: Song) => {
    setPlaylist(library);
    setCurrentSong(song);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-8 pb-32">
        <header className="flex flex-col items-center mb-12">
          <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Music Finder
          </h1>
          <form onSubmit={handleSearch} className="w-full max-w-lg flex gap-2">
            <Input
              type="text"
              placeholder="Digite o nome da música ou artista..."
              className="bg-gray-800 border-gray-700 focus:ring-purple-500 focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" className="bg-purple-600 hover:bg-purple-500" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            </Button>
          </form>
        </header>

        <main>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-gray-800 text-gray-400">
              <TabsTrigger value="search">Buscar</TabsTrigger>
              <TabsTrigger value="library">Minha Biblioteca</TabsTrigger>
            </TabsList>
            <TabsContent value="search">
              <SearchResults 
                results={searchResults} 
                onDownloadSong={handleDownloadSong} 
                isLoading={isLoading}
                downloadingId={downloadingId}
              />
            </TabsContent>
            <TabsContent value="library">
              <Library songs={library} onPlaySong={handlePlaySong} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <MusicPlayer />
    </div>
  );
};

export default Index;