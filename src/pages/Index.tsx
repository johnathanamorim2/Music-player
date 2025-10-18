import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Song } from "@/types";
import { SearchResults } from "@/components/SearchResults";
import { MusicPlayer } from "@/components/MusicPlayer";

// Mock data - will be replaced with actual search results
const mockSongs: Song[] = [
  { id: '1', title: 'Bohemian Rhapsody', artist: 'Queen', thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg', duration: '5:55' },
  { id: '2', title: 'Stairway to Heaven', artist: 'Led Zeppelin', thumbnail: 'https://i.ytimg.com/vi/QkF3oxziUI4/hqdefault.jpg', duration: '8:02' },
  { id: '3', title: 'Hotel California', artist: 'Eagles', thumbnail: 'https://i.ytimg.com/vi/09839DpTctU/hqdefault.jpg', duration: '6:30' },
  { id: '4', title: 'Smells Like Teen Spirit', artist: 'Nirvana', thumbnail: 'https://i.ytimg.com/vi/hTWKbfoikeg/hqdefault.jpg', duration: '4:38' },
  { id: '5', title: 'Like a Rolling Stone', artist: 'Bob Dylan', thumbnail: 'https://i.ytimg.com/vi/IwOfCgkyEj0/hqdefault.jpg', duration: '6:13' },
];


const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    // For now, we just show mock data
    setSearchResults(mockSongs);
  };

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
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
            />
            <Button type="submit" className="bg-purple-600 hover:bg-purple-500">
              <Search size={20} />
            </Button>
          </form>
        </header>

        <main>
          <SearchResults results={searchResults} onPlaySong={handlePlaySong} />
        </main>
      </div>
      <MusicPlayer currentSong={currentSong} isPlaying={isPlaying} />
    </div>
  );
};

export default Index;