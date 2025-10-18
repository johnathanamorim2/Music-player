import { Song } from "@/types";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Slider } from "./ui/slider";

interface MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
}

export const MusicPlayer = ({ currentSong, isPlaying }: MusicPlayerProps) => {
  if (!currentSong) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md text-white p-4 border-t border-purple-800">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 w-1/4">
          <img
            src={currentSong.thumbnail}
            alt={currentSong.title}
            className="w-14 h-14 rounded-md"
          />
          <div>
            <p className="font-semibold">{currentSong.title}</p>
            <p className="text-sm text-gray-400">{currentSong.artist}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 w-1/2">
          <div className="flex items-center gap-6">
            <button className="hover:text-purple-400 transition-colors">
              <SkipBack size={24} />
            </button>
            <button className="bg-purple-600 hover:bg-purple-500 rounded-full p-3 transition-colors">
              {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
            </button>
            <button className="hover:text-purple-400 transition-colors">
              <SkipForward size={24} />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-gray-400">0:00</span>
            <Slider defaultValue={[0]} max={100} step={1} className="w-full" />
            <span className="text-xs text-gray-400">{currentSong.duration}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-1/4 justify-end">
          <Volume2 size={20} />
          <Slider defaultValue={[50]} max={100} step={1} className="w-24" />
        </div>
      </div>
    </div>
  );
};