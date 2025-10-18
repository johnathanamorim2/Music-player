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
import { showError, showLoading, dismissToast, showSuccess } from "@/utils/toast";

const SUPABASE_URL = "https://zxbztnfskxrlnpgzofff.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4Ynp0bmZza3hybG5wZ3pvZmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NzA5NTIsImV4cCI6MjA3NjM0Njk1Mn0.JAB6U9dPDyQGt4f6G0sQKZ0MRQbSiIifoxieuRLBRoc";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [library, setLibrary] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSongLoading, setIsSongLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (activeAudioUrl) {
        URL.revokeObjectURL(activeAudioUrl);
      }
    };
  }, [activeAudioUrl]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || isLoading) return;

    console.log(`Starting search for: "${searchTerm}"`);
    setIsLoading(true);
    setSearchResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('search-youtube', {
        body: { query: searchTerm },
      });

      if (error) {
        console.error("Supabase function invocation error (search):", error);
        throw error;
      }
      
      console.log("Search function response data:", data);

      if (data) setSearchResults(data);

    } catch (error: any) {
      console.error("Caught error during search:", error);
      showError(`Erro ao buscar: ${error.message || 'Ocorreu um erro desconhecido'}`);
    } finally {
      setIsLoading(false);
      console.log("Search finished.");
    }
  };

  const handleDownloadSong = (song: Song) => {
    if (library.some(s => s.id === song.id)) {
      showError("Essa música já está na sua biblioteca.");
      return;
    }
    setLibrary(prevLibrary => [...prevLibrary, song]);
    showSuccess(`"${song.title}" foi adicionada à sua biblioteca!`);
  };

  const handlePlaySong = async (song: Song) => {
    console.log(`Attempting to play song: "${song.title}" (ID: ${song.id})`);
    if (currentSong?.id === song.id) {
      console.log("Toggling play/pause for the current song.");
      setIsPlaying(!isPlaying);
      return;
    }

    setIsSongLoading(true);
    setCurrentSong(song);
    setAudioUrl(null);
    if (activeAudioUrl) {
      URL.revokeObjectURL(activeAudioUrl);
      setActiveAudioUrl(null);
    }
    setIsPlaying(false);
    const toastId = showLoading("Carregando áudio...");
    console.log("Fetching audio stream via proxy...");

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-audio-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ videoId: song.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Proxy function returned an error:", errorData);
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      console.log("Successfully received audio stream response.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      console.log("Created blob URL for audio:", objectUrl);
      
      setActiveAudioUrl(objectUrl);
      setAudioUrl(objectUrl);
      setIsPlaying(true);

    } catch (error: any) {
      console.error("Caught error during audio fetch:", error);
      showError(`Erro ao carregar áudio: ${error.message}`);
      setCurrentSong(null);
    } finally {
      setIsSongLoading(false);
      dismissToast(toastId);
      console.log("Audio fetch process finished.");
    }
  };

  const handlePlayPause = (playing: boolean) => {
    setIsPlaying(playing);
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
              <SearchResults results={searchResults} onDownloadSong={handleDownloadSong} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="library">
              <Library songs={library} onPlaySong={handlePlaySong} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <MusicPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        audioUrl={audioUrl}
        isSongLoading={isSongLoading}
        onPlayPause={handlePlayPause}
      />
    </div>
  );
};

export default Index;