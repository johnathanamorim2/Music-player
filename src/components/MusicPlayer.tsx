import { Song } from "@/types";
import { Play, Pause, SkipBack, SkipForward, Volume2, Loader2, VolumeX } from "lucide-react";
import { Slider } from "./ui/slider";
import { useEffect, useRef, useState } from "react";

interface MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  audioUrl: string | null;
  isSongLoading: boolean;
  onPlayPause: (playing: boolean) => void;
}

export const MusicPlayer = ({ currentSong, isPlaying, audioUrl, isSongLoading, onPlayPause }: MusicPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentSong) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md text-white p-4 border-t border-purple-800">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => onPlayPause(false)}
      />
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 w-1/4">
          <img
            src={currentSong.thumbnail}
            alt={currentSong.title}
            className="w-14 h-14 rounded-md"
          />
          <div>
            <p className="font-semibold truncate">{currentSong.title}</p>
            <p className="text-sm text-gray-400 truncate">{currentSong.artist}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 w-1/2">
          <div className="flex items-center gap-6">
            <button className="hover:text-purple-400 transition-colors disabled:text-gray-600" disabled>
              <SkipBack size={24} />
            </button>
            <button onClick={() => onPlayPause(!isPlaying)} className="bg-purple-600 hover:bg-purple-500 rounded-full p-3 transition-colors">
              {isSongLoading ? <Loader2 className="animate-spin" size={28} /> : isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
            </button>
            <button className="hover:text-purple-400 transition-colors disabled:text-gray-600" disabled>
              <SkipForward size={24} />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-gray-400 w-10 text-center">{formatTime(progress)}</span>
            <Slider value={[progress]} max={duration || 1} onValueChange={handleProgressChange} className="w-full" />
            <span className="text-xs text-gray-400 w-10 text-center">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-1/4 justify-end">
          {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          <Slider value={[volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-24" />
        </div>
      </div>
    </div>
  );
};