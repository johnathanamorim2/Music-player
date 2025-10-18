import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { Song } from "@/types";
import { SearchResults } from "@/components/SearchResults";
import { MusicPlayer } from "@/components/MusicPlayer";
import { supabase } from "@/integrations/supabase/client";
import { showError, showLoading, dismissToast } from "@/utils/toast";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSongLoading, setIsSongLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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
    setIsPlaying(false);
    const toastId = showLoading("Carregando áudio...");
    console.log("Fetching audio stream...");

    try {
      const { data, error } = await supabase.functions.invoke('get-audio-stream', {
        body: { videoId: song.id },
      });

      if (error) {
        console.error("Supabase function invocation error (get-audio-stream):", error);
        throw error;
      }

      console.log("Audio stream function response data:", data);

      if (data && data.audioUrl) {
        console.log("Received audio URL. Setting state.");
        setAudioUrl(data.audioUrl);
        setIsPlaying(true);
      } else {
        console.error("Audio URL not found in response data:", data);
        throw new Error("Não foi possível obter o link do áudio.");
      }
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
          <SearchResults results={searchResults} onPlaySong={handlePlaySong} isLoading={isLoading} />
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