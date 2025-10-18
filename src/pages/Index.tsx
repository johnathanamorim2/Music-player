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
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [library, setLibrary] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const { setCurrentSong, setPlaylist } = useMusicPlayer();
  const { session } = useAuth();

  useEffect(() => {
    const fetchLibrary = async () => {
      if (!session) return;
      setIsLibraryLoading(true);
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedLibrary: Song[] = data.map(song => ({
          id: song.youtube_id,
          title: song.title,
          artist: song.artist,
          thumbnail: song.thumbnail_url,
          duration: song.duration,
          db_id: song.id,
        }));
        setLibrary(formattedLibrary);
      } catch (error) {
        showError("Não foi possível carregar sua biblioteca.");
      } finally {
        setIsLibraryLoading(false);
      }
    };
    fetchLibrary();
  }, [session]);

  useEffect(() => {
    setPlaylist(library);
  }, [library, setPlaylist]);

  const getDetailedErrorMessage = (error: any): string => {
    // The detailed message from our Edge Function is in error.context.error
    if (error?.context?.error) {
      return error.context.error;
    }
    // Fallback for other types of errors
    return error.message || "Ocorreu um erro desconhecido.";
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || isLoading || !session) return;

    setIsLoading(true);
    setSearchResults([]);

    const { data, error } = await supabase.functions.invoke('search-and-download', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { action: 'search', query: searchTerm },
    });
    
    setIsLoading(false);

    if (error) {
      showError(`Erro ao buscar: ${getDetailedErrorMessage(error)}`);
      return;
    }

    if (data) {
      setSearchResults(data.map((s: any) => ({...s, id: s.id})));
    }
  };

  const handleDownloadSong = async (song: Song) => {
    if (library.some(s => s.id === song.id) || downloadingId) {
      showError("Essa música já está na sua biblioteca.");
      return;
    }
    if (!session) return;

    setDownloadingId(song.id);

    const { data, error } = await supabase.functions.invoke('search-and-download', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { action: 'download', videoId: song.id },
    });

    setDownloadingId(null);

    if (error) {
      showError(`Erro ao adicionar música: ${getDetailedErrorMessage(error)}`);
      return;
    }
      
    if (data) {
      const newLibrarySong: Song = {
        id: data.youtube_id,
        title: data.title,
        artist: data.artist,
        thumbnail: data.thumbnail_url,
        duration: data.duration,
        db_id: data.id,
      };
      setLibrary(prev => [newLibrarySong, ...prev]);
      showSuccess(`"${song.title}" foi adicionada à sua biblioteca!`);
    }
  };

  const handlePlaySong = (song: Song) => {
    setPlaylist(library);
    setCurrentSong(song);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-8 pb-32">
        <Header />
        <form onSubmit={handleSearch} className="w-full max-w-lg flex gap-2 mx-auto">
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
        
        <main className="mt-12">
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
              {isLibraryLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                </div>
              ) : (
                <Library songs={library} onPlaySong={handlePlaySong} />
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <MusicPlayer />
    </div>
  );
};

export default Index;