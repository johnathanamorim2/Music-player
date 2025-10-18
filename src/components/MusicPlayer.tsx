import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Song } from "@/types";

interface MusicPlayerProps {
  currentSong: Song | null;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const MusicPlayer = ({ currentSong, onNext, onPrevious, onClose }: MusicPlayerProps) => {
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => setIsApiReady(true);
    } else {
      setIsApiReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isApiReady || !currentSong || !playerContainerRef.current) {
      return;
    }

    setIsLoading(true);
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      height: '0',
      width: '0',
      videoId: currentSong.id,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onReady: (event: any) => {
          event.target.setVolume(volume);
          event.target.playVideo();
        },
        onStateChange: (event: any) => {
          const playerState = event.data;
          if (playerState === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            setIsLoading(false);
            setDuration(event.target.getDuration());
          } else if (playerState === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          } else if (playerState === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            onNext?.();
          } else if (playerState === window.YT.PlayerState.BUFFERING) {
            setIsLoading(true);
          }
        },
        onError: (event: any) => {
          console.error('YouTube Player Error:', event.data);
          setIsLoading(false);
          setIsPlaying(false);
        },
      },
    });

  }, [isApiReady, currentSong]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const handleSeek = (value: number[]) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(value[0], true);
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(value[0]);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md text-white p-4 border-t border-purple-800 z-50">
      <div ref={playerContainerRef} style={{ display: 'none' }} />
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 w-1/4">
          <img src={currentSong.thumbnail} alt={currentSong.title} className="w-14 h-14 rounded-md" />
          <div>
            <p className="font-semibold truncate">{currentSong.title}</p>
            <p className="text-sm text-gray-400 truncate">{currentSong.artist}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 w-1/2">
          <div className="flex items-center gap-6">
            <Button size="icon" variant="ghost" onClick={onPrevious} className="hover:text-purple-400 transition-colors disabled:text-gray-600" disabled={!onPrevious}>
              <SkipBack size={24} />
            </Button>
            <Button onClick={togglePlay} className="bg-purple-600 hover:bg-purple-500 rounded-full p-3 transition-colors w-14 h-14 flex items-center justify-center" disabled={!isApiReady}>
              {isLoading ? <Loader2 className="animate-spin" size={28} /> : isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={onNext} className="hover:text-purple-400 transition-colors disabled:text-gray-600" disabled={!onNext}>
              <SkipForward size={24} />
            </Button>
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-gray-400 w-10 text-center">{formatTime(currentTime)}</span>
            <Slider value={[currentTime]} max={duration || 1} onValueChange={handleSeek} className="w-full" />
            <span className="text-xs text-gray-400 w-10 text-center">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 w-1/4 justify-end">
          <div className="flex items-center gap-2">
            <Volume2 size={20} />
            <Slider value={[volume]} max={100} step={1} onValueChange={handleVolumeChange} className="w-24" />
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="hover:text-purple-400 transition-colors">
            <X size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};